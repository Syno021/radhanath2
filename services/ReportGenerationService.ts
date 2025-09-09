import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import jsPDF from 'jspdf';
import { Platform } from 'react-native';
import * as XLSX from 'xlsx';

// Import jspdf-autotable with proper web support
let autoTable: any = null;

// Load jspdf-autotable plugin dynamically for better web compatibility
const loadAutoTable = async () => {
  if (autoTable) return autoTable;
  
  try {
    console.log('Loading jspdf-autotable plugin...', { platform: Platform.OS });
    
    if (Platform.OS === 'web') {
      // For web, import dynamically
      console.log('Using dynamic import for web...');
      const autoTableModule = await import('jspdf-autotable');
      console.log('AutoTable module loaded:', autoTableModule);
      autoTable = autoTableModule.default;
    } else {
      // For mobile, use static import
      console.log('Using require for mobile...');
      const autoTableModule = require('jspdf-autotable');
      autoTable = autoTableModule.default || autoTableModule;
    }
    
    console.log('AutoTable function:', autoTable, typeof autoTable);
    
    // Extend jsPDF prototype with autoTable
    if (autoTable && typeof autoTable === 'function') {
      console.log('Extending jsPDF with autoTable...');
      autoTable(jsPDF);
      console.log('jsPDF extended successfully');
    } else {
      console.warn('AutoTable is not a function, plugin may not be loaded correctly');
    }
    
    return autoTable;
  } catch (error) {
    console.error('Failed to load jspdf-autotable:', error);
    throw new Error('Failed to load PDF table plugin: ' + error.message);
  }
};

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface BookEntry {
  bookId?: string;
  title: string;
  quantity: number;
  points: number;
  publisher: string;
  isBBTBook: boolean;
}

export interface MonthlyReport {
  id?: string;
  month: string;
  year: number;
  totalBooks: number;
  totalPoints: number;
  books: BookEntry[];
  uploadedBy: string;
  uploadedAt: any;
  fileName: string;
}

export interface ReportStatistics {
  totalReports: number;
  totalBooksDistributed: number;
  totalPointsEarned: number;
  averageBooksPerReport: number;
  averagePointsPerReport: number;
  topPublishers: { publisher: string; count: number; percentage: number }[];
  bbtVsOtherBooks: { bbt: number; other: number; bbtPercentage: number };
  monthlyBreakdown: { month: string; year: number; books: number; points: number }[];
  topBooks: { title: string; totalQuantity: number; totalPoints: number }[];
  reportsByYear: { year: number; count: number; totalBooks: number; totalPoints: number }[];
}

export class ReportGenerationService {
  /**
   * Generate comprehensive statistics from all reports
   */
  static generateStatistics(reports: MonthlyReport[]): ReportStatistics {
    if (reports.length === 0) {
      return {
        totalReports: 0,
        totalBooksDistributed: 0,
        totalPointsEarned: 0,
        averageBooksPerReport: 0,
        averagePointsPerReport: 0,
        topPublishers: [],
        bbtVsOtherBooks: { bbt: 0, other: 0, bbtPercentage: 0 },
        monthlyBreakdown: [],
        topBooks: [],
        reportsByYear: []
      };
    }

    // Basic totals
    const totalBooksDistributed = reports.reduce((sum, report) => sum + report.totalBooks, 0);
    const totalPointsEarned = reports.reduce((sum, report) => sum + report.totalPoints, 0);
    const averageBooksPerReport = totalBooksDistributed / reports.length;
    const averagePointsPerReport = totalPointsEarned / reports.length;

    // Publisher analysis
    const publisherCounts: { [key: string]: number } = {};
    let bbtBooks = 0;
    let otherBooks = 0;
    const bookCounts: { [key: string]: { quantity: number; points: number } } = {};

    reports.forEach(report => {
      report.books.forEach(book => {
        // Publisher analysis
        publisherCounts[book.publisher] = (publisherCounts[book.publisher] || 0) + book.quantity;
        
        // BBT vs Other analysis
        if (book.isBBTBook) {
          bbtBooks += book.quantity;
        } else {
          otherBooks += book.quantity;
        }

        // Top books analysis
        if (bookCounts[book.title]) {
          bookCounts[book.title].quantity += book.quantity;
          bookCounts[book.title].points += book.quantity * book.points;
        } else {
          bookCounts[book.title] = {
            quantity: book.quantity,
            points: book.quantity * book.points
          };
        }
      });
    });

    const totalBooksForPublisher = Object.values(publisherCounts).reduce((sum, count) => sum + count, 0);
    const topPublishers = Object.entries(publisherCounts)
      .map(([publisher, count]) => ({
        publisher,
        count,
        percentage: totalBooksForPublisher > 0 ? (count / totalBooksForPublisher) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const bbtPercentage = (bbtBooks + otherBooks) > 0 ? (bbtBooks / (bbtBooks + otherBooks)) * 100 : 0;

    // Monthly breakdown
    const monthlyData: { [key: string]: { books: number; points: number } } = {};
    reports.forEach(report => {
      const key = `${report.month} ${report.year}`;
      if (monthlyData[key]) {
        monthlyData[key].books += report.totalBooks;
        monthlyData[key].points += report.totalPoints;
      } else {
        monthlyData[key] = {
          books: report.totalBooks,
          points: report.totalPoints
        };
      }
    });

    const monthlyBreakdown = Object.entries(monthlyData)
      .map(([key, data]) => {
        const [month, year] = key.split(' ');
        return {
          month,
          year: parseInt(year),
          books: data.books,
          points: data.points
        };
      })
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'];
        return months.indexOf(b.month) - months.indexOf(a.month);
      });

    // Top books
    const topBooks = Object.entries(bookCounts)
      .map(([title, data]) => ({
        title,
        totalQuantity: data.quantity,
        totalPoints: data.points
      }))
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 20);

    // Reports by year
    const yearData: { [key: number]: { count: number; totalBooks: number; totalPoints: number } } = {};
    reports.forEach(report => {
      if (yearData[report.year]) {
        yearData[report.year].count += 1;
        yearData[report.year].totalBooks += report.totalBooks;
        yearData[report.year].totalPoints += report.totalPoints;
      } else {
        yearData[report.year] = {
          count: 1,
          totalBooks: report.totalBooks,
          totalPoints: report.totalPoints
        };
      }
    });

    const reportsByYear = Object.entries(yearData)
      .map(([year, data]) => ({
        year: parseInt(year),
        count: data.count,
        totalBooks: data.totalBooks,
        totalPoints: data.totalPoints
      }))
      .sort((a, b) => b.year - a.year);

    return {
      totalReports: reports.length,
      totalBooksDistributed,
      totalPointsEarned,
      averageBooksPerReport,
      averagePointsPerReport,
      topPublishers,
      bbtVsOtherBooks: {
        bbt: bbtBooks,
        other: otherBooks,
        bbtPercentage
      },
      monthlyBreakdown,
      topBooks,
      reportsByYear
    };
  }

  /**
   * Generate PDF report with statistics
   */
  static async generatePDFReport(
    reports: MonthlyReport[],
    statistics: ReportStatistics,
    reportType: 'summary' | 'detailed' = 'summary'
  ): Promise<string> {
    // Load the autoTable plugin first
    try {
      await loadAutoTable();
    } catch (error) {
      console.warn('Failed to load autoTable plugin, using fallback method:', error);
    }
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;
    
    // Check if autoTable is available
    const hasAutoTable = typeof doc.autoTable === 'function';
    console.log('PDF generation - hasAutoTable:', hasAutoTable, 'doc.autoTable:', doc.autoTable);

    // Helper function to add new page if needed
    const checkPageBreak = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
        return true;
      }
      return false;
    };

    // Helper function to create tables without autoTable (fallback)
    const createSimpleTable = (headers: string[], data: string[][], startY: number, title?: string) => {
      let currentY = startY;
      const cellHeight = 8;
      const cellPadding = 4;
      const leftMargin = 20;
      
      // Calculate column widths
      const pageWidth = doc.internal.pageSize.getWidth();
      const availableWidth = pageWidth - (leftMargin * 2);
      const colWidth = availableWidth / headers.length;
      
      // Draw title if provided
      if (title) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(title, leftMargin, currentY);
        currentY += 10;
      }
      
      // Draw headers
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      headers.forEach((header, index) => {
        const x = leftMargin + (index * colWidth);
        doc.rect(x, currentY - cellHeight, colWidth, cellHeight);
        doc.text(header, x + cellPadding, currentY - 2, { align: 'left' });
      });
      currentY += cellHeight;
      
      // Draw data rows
      doc.setFont('helvetica', 'normal');
      data.forEach(row => {
        row.forEach((cell, index) => {
          const x = leftMargin + (index * colWidth);
          doc.rect(x, currentY - cellHeight, colWidth, cellHeight);
          const cellText = cell.length > 20 ? cell.substring(0, 17) + '...' : cell;
          doc.text(cellText, x + cellPadding, currentY - 2, { align: 'left' });
        });
        currentY += cellHeight;
      });
      
      return currentY + 10;
    };

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('BBT Africa Connect - Book Distribution Report', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;

    // Executive Summary
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Executive Summary', 20, yPosition);
    yPosition += 15;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const summaryData = [
      ['Total Reports Submitted', statistics.totalReports.toString()],
      ['Total Books Distributed', statistics.totalBooksDistributed.toLocaleString()],
      ['Total Points Earned', statistics.totalPointsEarned.toLocaleString()],
      ['Average Books per Report', Math.round(statistics.averageBooksPerReport).toString()],
      ['Average Points per Report', Math.round(statistics.averagePointsPerReport).toString()],
      ['BBT Books Percentage', `${statistics.bbtVsOtherBooks.bbtPercentage.toFixed(1)}%`]
    ];

    if (hasAutoTable) {
      doc.autoTable({
        startY: yPosition,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [255, 107, 0] },
        styles: { fontSize: 10 },
        margin: { left: 20, right: 20 }
      });
      yPosition = (doc as any).lastAutoTable.finalY + 15;
    } else {
      yPosition = createSimpleTable(['Metric', 'Value'], summaryData, yPosition);
    }

    // Top Publishers
    if (statistics.topPublishers.length > 0) {
      checkPageBreak(60);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Top Publishers', 20, yPosition);
      yPosition += 10;

      const publisherData = statistics.topPublishers.slice(0, 10).map(pub => [
        pub.publisher,
        pub.count.toString(),
        `${pub.percentage.toFixed(1)}%`
      ]);

      if (hasAutoTable) {
        doc.autoTable({
          startY: yPosition,
          head: [['Publisher', 'Books Distributed', 'Percentage']],
          body: publisherData,
          theme: 'grid',
          headStyles: { fillColor: [255, 107, 0] },
          styles: { fontSize: 9 },
          margin: { left: 20, right: 20 }
        });
        yPosition = (doc as any).lastAutoTable.finalY + 15;
      } else {
        yPosition = createSimpleTable(['Publisher', 'Books Distributed', 'Percentage'], publisherData, yPosition);
      }
    }

    // Monthly Breakdown
    if (statistics.monthlyBreakdown.length > 0) {
      checkPageBreak(80);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Monthly Distribution Breakdown', 20, yPosition);
      yPosition += 10;

      const monthlyData = statistics.monthlyBreakdown.slice(0, 12).map(month => [
        `${month.month} ${month.year}`,
        month.books.toString(),
        month.points.toString()
      ]);

      if (hasAutoTable) {
        doc.autoTable({
          startY: yPosition,
          head: [['Month/Year', 'Books Distributed', 'Points Earned']],
          body: monthlyData,
          theme: 'grid',
          headStyles: { fillColor: [255, 107, 0] },
          styles: { fontSize: 9 },
          margin: { left: 20, right: 20 }
        });
        yPosition = (doc as any).lastAutoTable.finalY + 15;
      } else {
        yPosition = createSimpleTable(['Month/Year', 'Books Distributed', 'Points Earned'], monthlyData, yPosition);
      }
    }

    // Top Books
    if (statistics.topBooks.length > 0) {
      checkPageBreak(100);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Top Distributed Books', 20, yPosition);
      yPosition += 10;

      const bookData = statistics.topBooks.slice(0, 15).map(book => [
        book.title.length > 40 ? book.title.substring(0, 40) + '...' : book.title,
        book.totalQuantity.toString(),
        book.totalPoints.toString()
      ]);

      if (hasAutoTable) {
        doc.autoTable({
          startY: yPosition,
          head: [['Book Title', 'Total Quantity', 'Total Points']],
          body: bookData,
          theme: 'grid',
          headStyles: { fillColor: [255, 107, 0] },
          styles: { fontSize: 8 },
          margin: { left: 20, right: 20 }
        });
        yPosition = (doc as any).lastAutoTable.finalY + 15;
      } else {
        yPosition = createSimpleTable(['Book Title', 'Total Quantity', 'Total Points'], bookData, yPosition);
      }
    }

    // Detailed Reports (if requested)
    if (reportType === 'detailed' && reports.length > 0) {
      checkPageBreak(50);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Detailed Reports', 20, yPosition);
      yPosition += 15;

      reports.forEach((report, index) => {
        checkPageBreak(40);
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`${report.month} ${report.year} - ${report.fileName}`, 20, yPosition);
        yPosition += 10;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Books: ${report.totalBooks} | Points: ${report.totalPoints}`, 20, yPosition);
        yPosition += 15;

        if (report.books.length > 0) {
          const reportData = report.books.map(book => [
            book.title.length > 30 ? book.title.substring(0, 30) + '...' : book.title,
            book.quantity.toString(),
            book.points.toString(),
            book.publisher,
            book.isBBTBook ? 'BBT' : 'Other'
          ]);

          if (hasAutoTable) {
            doc.autoTable({
              startY: yPosition,
              head: [['Title', 'Qty', 'Points', 'Publisher', 'Type']],
              body: reportData,
              theme: 'grid',
              headStyles: { fillColor: [200, 200, 200] },
              styles: { fontSize: 8 },
              margin: { left: 20, right: 20 }
            });
            yPosition = (doc as any).lastAutoTable.finalY + 15;
          } else {
            yPosition = createSimpleTable(['Title', 'Qty', 'Points', 'Publisher', 'Type'], reportData, yPosition);
          }
        }

        if (index < reports.length - 1) {
          yPosition += 5;
        }
      });
    }

    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - 30, pageHeight - 10);
      doc.text('BBT Africa Connect - Hare Krishna', 20, pageHeight - 10);
    }

    // Save the PDF
    const fileName = `BBT_Book_Distribution_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    
    if (Platform.OS === 'web') {
      // For web, return the data URI directly
      const pdfOutput = doc.output('datauristring');
      return pdfOutput;
    } else {
      // For mobile, save to file system
      const pdfPath = `${FileSystem.documentDirectory}${fileName}`;
      const pdfOutput = doc.output('datauristring');
      const base64Data = pdfOutput.split(',')[1];
      
      await FileSystem.writeAsStringAsync(pdfPath, base64Data, {
        encoding: FileSystem.EncodingType.Base64
      });

      return pdfPath;
    }
  }

  /**
   * Generate Excel report with statistics
   */
  static async generateExcelReport(
    reports: MonthlyReport[],
    statistics: ReportStatistics
  ): Promise<string> {
    const workbook = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      ['BBT Africa Connect - Book Distribution Report'],
      [`Generated on: ${new Date().toLocaleDateString()}`],
      [''],
      ['Executive Summary'],
      ['Total Reports Submitted', statistics.totalReports],
      ['Total Books Distributed', statistics.totalBooksDistributed],
      ['Total Points Earned', statistics.totalPointsEarned],
      ['Average Books per Report', Math.round(statistics.averageBooksPerReport)],
      ['Average Points per Report', Math.round(statistics.averagePointsPerReport)],
      ['BBT Books Percentage', `${statistics.bbtVsOtherBooks.bbtPercentage.toFixed(1)}%`],
      [''],
      ['BBT vs Other Books'],
      ['BBT Books', statistics.bbtVsOtherBooks.bbt],
      ['Other Books', statistics.bbtVsOtherBooks.other]
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Top Publishers Sheet
    if (statistics.topPublishers.length > 0) {
      const publisherData = [
        ['Publisher', 'Books Distributed', 'Percentage'],
        ...statistics.topPublishers.map(pub => [
          pub.publisher,
          pub.count,
          `${pub.percentage.toFixed(1)}%`
        ])
      ];

      const publisherSheet = XLSX.utils.aoa_to_sheet(publisherData);
      XLSX.utils.book_append_sheet(workbook, publisherSheet, 'Top Publishers');
    }

    // Monthly Breakdown Sheet
    if (statistics.monthlyBreakdown.length > 0) {
      const monthlyData = [
        ['Month/Year', 'Books Distributed', 'Points Earned'],
        ...statistics.monthlyBreakdown.map(month => [
          `${month.month} ${month.year}`,
          month.books,
          month.points
        ])
      ];

      const monthlySheet = XLSX.utils.aoa_to_sheet(monthlyData);
      XLSX.utils.book_append_sheet(workbook, monthlySheet, 'Monthly Breakdown');
    }

    // Top Books Sheet
    if (statistics.topBooks.length > 0) {
      const bookData = [
        ['Book Title', 'Total Quantity', 'Total Points'],
        ...statistics.topBooks.map(book => [
          book.title,
          book.totalQuantity,
          book.totalPoints
        ])
      ];

      const bookSheet = XLSX.utils.aoa_to_sheet(bookData);
      XLSX.utils.book_append_sheet(workbook, bookSheet, 'Top Books');
    }

    // Reports by Year Sheet
    if (statistics.reportsByYear.length > 0) {
      const yearData = [
        ['Year', 'Number of Reports', 'Total Books', 'Total Points'],
        ...statistics.reportsByYear.map(year => [
          year.year,
          year.count,
          year.totalBooks,
          year.totalPoints
        ])
      ];

      const yearSheet = XLSX.utils.aoa_to_sheet(yearData);
      XLSX.utils.book_append_sheet(workbook, yearSheet, 'Reports by Year');
    }

    // Detailed Reports Sheet
    if (reports.length > 0) {
      const detailedData = [
        ['Month', 'Year', 'File Name', 'Total Books', 'Total Points', 'Upload Date']
      ];

      reports.forEach(report => {
        detailedData.push([
          report.month,
          report.year,
          report.fileName,
          report.totalBooks,
          report.totalPoints,
          report.uploadedAt ? new Date(report.uploadedAt.seconds * 1000).toLocaleDateString() : 'Unknown'
        ]);
      });

      const detailedSheet = XLSX.utils.aoa_to_sheet(detailedData);
      XLSX.utils.book_append_sheet(workbook, detailedSheet, 'All Reports');
    }

    // Individual Book Entries Sheet
    if (reports.length > 0) {
      const bookEntriesData = [
        ['Report Month', 'Report Year', 'Book Title', 'Quantity', 'Points per Book', 'Total Points', 'Publisher', 'BBT Book', 'Book ID']
      ];

      reports.forEach(report => {
        report.books.forEach(book => {
          bookEntriesData.push([
            report.month,
            report.year,
            book.title,
            book.quantity,
            book.points,
            book.quantity * book.points,
            book.publisher,
            book.isBBTBook ? 'Yes' : 'No',
            book.bookId || ''
          ]);
        });
      });

      const bookEntriesSheet = XLSX.utils.aoa_to_sheet(bookEntriesData);
      XLSX.utils.book_append_sheet(workbook, bookEntriesSheet, 'All Book Entries');
    }

    // Save the Excel file
    const fileName = `BBT_Book_Distribution_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    if (Platform.OS === 'web') {
      // For web, return the Excel data directly
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });
      return `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${excelBuffer}`;
    } else {
      // For mobile, save to file system
      const excelPath = `${FileSystem.documentDirectory}${fileName}`;
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });
      
      await FileSystem.writeAsStringAsync(excelPath, excelBuffer, {
        encoding: FileSystem.EncodingType.Base64
      });

      return excelPath;
    }
  }

  /**
   * Share the generated report file
   */
  static async shareReport(filePath: string, fileName: string): Promise<void> {
    console.log('shareReport called', { filePath, fileName, platform: Platform.OS });
    
    try {
      if (Platform.OS === 'web') {
        console.log('Web platform detected, creating download link...');
        
        // Check if filePath is a data URI (for web) or file path (for mobile)
        if (filePath.startsWith('data:')) {
          console.log('Data URI detected, creating download from data URI...');
          // For web, create a download link from data URI with better browser compatibility
          try {
            // Method 1: Try direct download
            const a = document.createElement('a');
            a.href = filePath;
            a.download = fileName;
            a.style.display = 'none';
            document.body.appendChild(a);
            console.log('Triggering download from data URI...');
            a.click();
            document.body.removeChild(a);
            console.log('Download triggered successfully');
          } catch (error) {
            console.log('Direct download failed, trying alternative method...', error);
            // Method 2: Alternative approach using blob
            try {
              const response = await fetch(filePath);
              const blob = await response.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = fileName;
              a.style.display = 'none';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              window.URL.revokeObjectURL(url);
              console.log('Alternative download method successful');
            } catch (altError) {
              console.log('Alternative download also failed, trying window.open...', altError);
              // Method 3: Fallback to window.open
              const newWindow = window.open(filePath, '_blank');
              if (newWindow) {
                console.log('Opened in new window');
              } else {
                throw new Error('All download methods failed. Please check browser settings.');
              }
            }
          }
        } else {
          console.log('File path detected, fetching file...');
          // For web, create a download link from file path
          const response = await fetch(filePath);
          console.log('Fetch response:', response.status);
          const blob = await response.blob();
          console.log('Blob created:', blob.size, 'bytes');
          const url = window.URL.createObjectURL(blob);
          console.log('Object URL created:', url);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          console.log('Triggering download...');
          a.click();
          window.URL.revokeObjectURL(url);
          console.log('Download triggered successfully');
        }
      } else {
        console.log('Mobile platform detected, using sharing...');
        // For mobile, use sharing
        const isAvailable = await Sharing.isAvailableAsync();
        console.log('Sharing available:', isAvailable);
        
        if (!isAvailable) {
          throw new Error('Sharing is not available on this device');
        }
        
        await Sharing.shareAsync(filePath, {
          mimeType: fileName.endsWith('.pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: `Share ${fileName}`
        });
        console.log('Sharing completed successfully');
      }
    } catch (error) {
      console.error('Error sharing report:', error);
      throw new Error('Failed to share report: ' + error.message);
    }
  }

  /**
   * Generate and share PDF report
   */
  static async generateAndSharePDF(
    reports: MonthlyReport[],
    reportType: 'summary' | 'detailed' = 'summary'
  ): Promise<void> {
    console.log('ReportGenerationService.generateAndSharePDF called', { reportsCount: reports.length, reportType });
    
    try {
      console.log('Generating statistics...');
      const statistics = this.generateStatistics(reports);
      console.log('Statistics generated:', statistics);
      
      console.log('Generating PDF report...');
      const filePath = await this.generatePDFReport(reports, statistics, reportType);
      console.log('PDF report generated at:', filePath);
      
      const fileName = `BBT_Book_Distribution_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      console.log('Sharing report:', fileName);
      await this.shareReport(filePath, fileName);
      console.log('Report shared successfully');
    } catch (error) {
      console.error('Error in generateAndSharePDF:', error);
      throw error;
    }
  }

  /**
   * Generate and share Excel report
   */
  static async generateAndShareExcel(reports: MonthlyReport[]): Promise<void> {
    console.log('ReportGenerationService.generateAndShareExcel called', { reportsCount: reports.length });
    
    try {
      console.log('Generating statistics...');
      const statistics = this.generateStatistics(reports);
      console.log('Statistics generated:', statistics);
      
      console.log('Generating Excel report...');
      const filePath = await this.generateExcelReport(reports, statistics);
      console.log('Excel report generated at:', filePath);
      
      const fileName = `BBT_Book_Distribution_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      console.log('Sharing report:', fileName);
      await this.shareReport(filePath, fileName);
      console.log('Report shared successfully');
    } catch (error) {
      console.error('Error in generateAndShareExcel:', error);
      throw error;
    }
  }

  /**
   * Generate Excel report and return download URL for manual download
   */
  static async generateExcelDownloadUrl(reports: MonthlyReport[]): Promise<string> {
    console.log('Generating Excel download URL...');
    const statistics = this.generateStatistics(reports);
    const filePath = await this.generateExcelReport(reports, statistics);
    return filePath;
  }

  /**
   * Generate PDF report and return download URL for manual download
   */
  static async generatePDFDownloadUrl(reports: MonthlyReport[], reportType: 'summary' | 'detailed' = 'summary'): Promise<string> {
    console.log('Generating PDF download URL...');
    const statistics = this.generateStatistics(reports);
    
    try {
      const filePath = await this.generatePDFReport(reports, statistics, reportType);
      return filePath;
    } catch (error) {
      console.error('PDF generation failed, trying alternative method:', error);
      // Fallback to simple PDF generation without autoTable
      return await this.generateSimplePDFReport(reports, statistics, reportType);
    }
  }

  /**
   * Generate a simple PDF report without autoTable (fallback method)
   */
  static async generateSimplePDFReport(
    reports: MonthlyReport[],
    statistics: ReportStatistics,
    reportType: 'summary' | 'detailed' = 'summary'
  ): Promise<string> {
    console.log('Generating simple PDF report (fallback method)...');
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Helper function to add new page if needed
    const checkPageBreak = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
        return true;
      }
      return false;
    };

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('BBT Africa Connect - Book Distribution Report', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;

    // Executive Summary
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Executive Summary', 20, yPosition);
    yPosition += 15;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const summaryItems = [
      `Total Reports Submitted: ${statistics.totalReports}`,
      `Total Books Distributed: ${statistics.totalBooksDistributed.toLocaleString()}`,
      `Total Points Earned: ${statistics.totalPointsEarned.toLocaleString()}`,
      `Average Books per Report: ${Math.round(statistics.averageBooksPerReport)}`,
      `Average Points per Report: ${Math.round(statistics.averagePointsPerReport)}`,
      `BBT Books Percentage: ${statistics.bbtVsOtherBooks.bbtPercentage.toFixed(1)}%`
    ];

    summaryItems.forEach(item => {
      checkPageBreak(15);
      doc.text(item, 20, yPosition);
      yPosition += 12;
    });

    yPosition += 10;

    // Top Publishers
    if (statistics.topPublishers.length > 0) {
      checkPageBreak(60);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Top Publishers', 20, yPosition);
      yPosition += 15;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      statistics.topPublishers.slice(0, 10).forEach(pub => {
        checkPageBreak(12);
        doc.text(`${pub.publisher}: ${pub.count} books (${pub.percentage.toFixed(1)}%)`, 20, yPosition);
        yPosition += 10;
      });
      yPosition += 10;
    }

    // Monthly Breakdown
    if (statistics.monthlyBreakdown.length > 0) {
      checkPageBreak(80);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Monthly Distribution Breakdown', 20, yPosition);
      yPosition += 15;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      statistics.monthlyBreakdown.slice(0, 12).forEach(month => {
        checkPageBreak(12);
        doc.text(`${month.month} ${month.year}: ${month.books} books, ${month.points} points`, 20, yPosition);
        yPosition += 10;
      });
      yPosition += 10;
    }

    // Top Books
    if (statistics.topBooks.length > 0) {
      checkPageBreak(100);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Top Distributed Books', 20, yPosition);
      yPosition += 15;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      statistics.topBooks.slice(0, 15).forEach(book => {
        checkPageBreak(12);
        const title = book.title.length > 50 ? book.title.substring(0, 47) + '...' : book.title;
        doc.text(`${title}: ${book.totalQuantity} copies, ${book.totalPoints} points`, 20, yPosition);
        yPosition += 10;
      });
    }

    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - 30, pageHeight - 10);
      doc.text('BBT Africa Connect - Hare Krishna', 20, pageHeight - 10);
    }

    // Save the PDF
    const fileName = `BBT_Book_Distribution_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    
    if (Platform.OS === 'web') {
      // For web, return the data URI directly
      const pdfOutput = doc.output('datauristring');
      return pdfOutput;
    } else {
      // For mobile, save to file system
      const pdfPath = `${FileSystem.documentDirectory}${fileName}`;
      const pdfOutput = doc.output('datauristring');
      const base64Data = pdfOutput.split(',')[1];
      
      await FileSystem.writeAsStringAsync(pdfPath, base64Data, {
        encoding: FileSystem.EncodingType.Base64
      });

      return pdfPath;
    }
  }
}
