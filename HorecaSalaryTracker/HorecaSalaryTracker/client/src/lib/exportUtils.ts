import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Get initials for dashboard
export const getInitials = (name: string) => {
  if (!name) return 'SR'; // Default: Sales Rep
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Format currency
export const formatCurrency = (amount: number | undefined) => {
  if (amount === undefined) return '$0';
  return `$${amount.toLocaleString()}`;
};

// Export to PDF utility
export const exportToPdf = ({
  title,
  representativeName,
  subtitle,
  tables,
}: {
  title: string;
  representativeName: string | undefined;
  subtitle?: string;
  tables: {
    title?: string;
    head: string[][];
    body: any[][];
    startY?: number;
  }[];
}) => {
  const doc = new jsPDF();
  
  // Title and representative info
  doc.setFontSize(20);
  doc.text(title, 105, 15, { align: 'center' });
  doc.setFontSize(12);
  
  if (subtitle) {
    doc.text(subtitle, 105, 25, { align: 'center' });
  }
  
  doc.text(`Representative: ${representativeName || 'Sales Representative'}`, 105, subtitle ? 35 : 25, { align: 'center' });
  
  let lastY = subtitle ? 45 : 35;
  
  // Add tables
  tables.forEach((table, index) => {
    if (table.title) {
      doc.setFontSize(14);
      doc.text(table.title, 14, lastY + 10);
      lastY += 15;
    }
    
    autoTable(doc, {
      head: table.head,
      body: table.body,
      startY: table.startY || lastY,
      margin: { horizontal: 10 }
    });
    
    // Update lastY position for the next table
    lastY = (doc as any).lastAutoTable.finalY + 10;
  });
  
  // Generate filename
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `${title.replace(/\\s+/g, '_')}_${timestamp}.pdf`;
  
  doc.save(filename);
};

// Export to Excel utility
export const exportToExcel = ({
  title,
  representativeName,
  subtitle,
  sheets,
}: {
  title: string;
  representativeName: string | undefined;
  subtitle?: string;
  sheets: {
    name: string;
    data: any[][];
  }[];
}) => {
  // Create workbook
  const wb = XLSX.utils.book_new();
  
  // Process each sheet
  sheets.forEach(sheet => {
    // Add header rows with title and representative info
    const headerRows = [
      [title, '', '', ''],
    ];
    
    if (subtitle) {
      headerRows.push([subtitle, '', '', '']);
    }
    
    headerRows.push(['Representative:', representativeName || 'Sales Representative', '', '']);
    headerRows.push(['', '', '', '']); // Empty row as separator
    
    // Combine headers with data
    const fullData = [...headerRows, ...sheet.data];
    
    // Create worksheet from data
    const ws = XLSX.utils.aoa_to_sheet(fullData);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, sheet.name);
  });
  
  // Generate filename
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `${title.replace(/\\s+/g, '_')}_${timestamp}.xlsx`;
  
  // Write to file and trigger download
  XLSX.writeFile(wb, filename);
};