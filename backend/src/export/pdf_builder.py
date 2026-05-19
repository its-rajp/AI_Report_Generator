import os
import datetime
import re
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, PageBreak, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_JUSTIFY, TA_CENTER
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from loguru import logger
from pathlib import Path
import sys

sys.path.append(str(Path(__file__).parent.parent.parent))
from config.settings import PROCESSED_DIR

def add_header_footer(canvas_obj, doc):
    canvas_obj.saveState()
    
    # Header
    canvas_obj.setFont("Helvetica-Bold", 10)
    canvas_obj.drawString(doc.leftMargin, doc.height + doc.topMargin + 10, "SimulReport - Engineering Analysis")
    
    # Footer
    canvas_obj.setFont("Helvetica", 9)
    page_num = canvas_obj.getPageNumber()
    text = f"Page {page_num}"
    canvas_obj.drawRightString(doc.width + doc.leftMargin, doc.bottomMargin - 20, text)
    
    canvas_obj.restoreState()

class PDFBuilder:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        
        # Custom Styles
        self.styles.add(ParagraphStyle(
            name='CoverTitle',
            parent=self.styles['Heading1'],
            fontSize=28,
            leading=34,
            alignment=TA_CENTER,
            spaceAfter=20
        ))
        
        self.styles.add(ParagraphStyle(
            name='CoverSubtitle',
            parent=self.styles['Normal'],
            fontSize=16,
            leading=22,
            alignment=TA_CENTER,
            spaceAfter=10,
            textColor='#444444'
        ))

        self.styles.add(ParagraphStyle(
            name='JustifiedBody',
            parent=self.styles['Normal'],
            alignment=TA_JUSTIFY,
            fontSize=11,
            leading=16,
            spaceAfter=12
        ))
        
        self.styles.add(ParagraphStyle(
            name='BulletItem',
            parent=self.styles['Normal'],
            alignment=TA_JUSTIFY,
            fontSize=11,
            leading=16,
            leftIndent=20,
            spaceAfter=6
        ))
        
        self.heading_style = self.styles['Heading1']
        
    def _sanitize(self, text: str) -> str:
        """Strip any HTML tags the AI might emit that ReportLab can't handle,
        then re-apply only the safe inline tags we control."""
        # Remove ALL HTML tags first (sub, sup, u, s, span, etc.)
        text = re.sub(r'<(?!/?b>|/?i>|/?br/?>)[^>]+>', '', text)
        # Escape bare & characters that aren't already an entity
        text = re.sub(r'&(?!(?:amp|lt|gt|quot|apos|bull);)', '&amp;', text)
        # Strip LaTeX-style fragments that can confuse the parser
        text = re.sub(r'\$[^$]*\$', '', text)
        return text

    def _safe_paragraph(self, text: str, style) -> Paragraph:
        """Try to build a Paragraph, fall back to plain-escaped text on failure."""
        try:
            return Paragraph(text, style)
        except Exception:
            # Strip all markup and try again as completely plain text
            plain = re.sub(r'<[^>]+>', '', text)
            try:
                return Paragraph(plain, style)
            except Exception:
                return Paragraph("(content rendering error)", style)

    def _parse_markdown(self, text: str, story: list):
        """Parse LLM markdown to ReportLab Paragraphs"""
        lines = text.split('\n')
        for line in lines:
            line = line.strip()
            if not line:
                story.append(Spacer(1, 6))
                continue
            
            # Apply inline bold/italic BEFORE sanitizing so we keep them
            line = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', line)
            line = re.sub(r'(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)', r'<i>\1</i>', line)
            
            # Now sanitize to remove any AI-generated HTML we can't handle
            line = self._sanitize(line)

            # Block formatting
            if line.startswith('#### '):
                story.append(self._safe_paragraph(line[5:], self.styles['Heading4'] if 'Heading4' in self.styles else self.styles['Heading3']))
            elif line.startswith('### '):
                story.append(self._safe_paragraph(line[4:], self.styles['Heading3']))
            elif line.startswith('## '):
                story.append(self._safe_paragraph(line[3:], self.styles['Heading2']))
            elif line.startswith('# '):
                story.append(self._safe_paragraph(line[2:], self.styles['Heading1']))
            elif line.startswith('* ') or line.startswith('- '):
                story.append(self._safe_paragraph(f"&bull; {line[2:]}", self.styles['BulletItem']))
            elif line.startswith('---') or line.startswith('==='):
                story.append(Spacer(1, 8))
            else:
                story.append(self._safe_paragraph(line, self.styles['JustifiedBody']))
        
    def build_report(self, content: dict, viz_files: dict, params: dict) -> str:
        project_name = params.get("project_name", "Untitled_Report").replace(" ", "_")
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        output_filename = PROCESSED_DIR / f"{project_name}_{timestamp}.pdf"
        
        doc = SimpleDocTemplate(
            str(output_filename), 
            pagesize=letter,
            rightMargin=72, leftMargin=72,
            topMargin=72, bottomMargin=72
        )
        
        story = []
        
        # --- COVER PAGE ---
        story.append(Spacer(1, 2 * inch))
        story.append(Paragraph("Engineering Simulation Report", self.styles['CoverTitle']))
        story.append(Paragraph(f"Project: {params.get('project_name', 'N/A')}", self.styles['CoverSubtitle']))
        story.append(Spacer(1, 0.5 * inch))
        story.append(Paragraph(f"Industry: {params.get('industry', 'N/A')}", self.styles['CoverSubtitle']))
        story.append(Paragraph(f"Service: {params.get('service', 'N/A')}", self.styles['CoverSubtitle']))
        story.append(Spacer(1, 1 * inch))
        story.append(Paragraph(f"Date: {datetime.datetime.now().strftime('%B %d, %Y')}", self.styles['CoverSubtitle']))
        story.append(PageBreak())
        
        # --- CONTENT ---
        if "full_text" in content:
            self._parse_markdown(content["full_text"], story)
            story.append(Spacer(1, 24))
            
        # --- VISUALIZATIONS ---
        story.append(Paragraph("Visualizations & Diagrams", self.heading_style))
        story.append(Spacer(1, 12))
        
        if viz_files:
            story.append(Paragraph("The following plots and diagrams were generated from the analysis of your uploaded data:", self.styles['JustifiedBody']))
            story.append(Spacer(1, 12))
            
            for name, path in viz_files.items():
                if os.path.exists(path):
                    img_story = []
                    img = Image(path, width=6*inch, height=3.75*inch)
                    img_story.append(img)
                    img_story.append(Spacer(1, 6))
                    
                    caption_text = f"Figure: {name.replace('_', ' ').title()}"
                    img_story.append(Paragraph(f"<b>{caption_text}</b>", self.styles['CoverSubtitle']))
                    img_story.append(Spacer(1, 24))
                    
                    story.append(KeepTogether(img_story))
        else:
            story.append(Paragraph("No numerical data available for visualization.", self.styles['JustifiedBody']))
            
        doc.build(story, onFirstPage=add_header_footer, onLaterPages=add_header_footer)
        logger.info(f"Built PDF report with formatting and embedded images: {output_filename}")
        
        return str(output_filename)
