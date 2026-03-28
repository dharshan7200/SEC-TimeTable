import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const exportAsPNG = async (elementId, filename = 'timetable') => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Element not found');
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#000000',
      logging: false,
      useCORS: true
    });

    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    return true;
  } catch (error) {
    console.error('Error exporting as PNG:', error);
    return false;
  }
};

export const exportAsPDF = async (elementId, filename = 'timetable') => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Element not found');
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#000000',
      logging: false,
      useCORS: true
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`${filename}.pdf`);

    return true;
  } catch (error) {
    console.error('Error exporting as PDF:', error);
    return false;
  }
};
