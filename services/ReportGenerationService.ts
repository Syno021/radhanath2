import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import jsPDF from 'jspdf';
import { Platform } from 'react-native';
import * as XLSX from 'xlsx';


// Simple table generation without jspdf-autotable for mobile compatibility
const createSimpleTable = (doc: jsPDF, data: string[][], startY: number, margin: number) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const colWidth = (pageWidth - 2 * margin) / data[0].length;
  let currentY = startY;
  
  data.forEach((row, rowIndex) => {
    if (currentY > doc.internal.pageSize.getHeight() - 30) {
      doc.addPage();
      currentY = margin;
    }
    
    row.forEach((cell, colIndex) => {
      const x = margin + (colIndex * colWidth);
      doc.text(cell, x, currentY);
    });
    currentY += 10;
  });
  
  return currentY;
};


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

export interface BookEntry {
  bookId?: string;
  title: string;
  quantity: number;
  points: number;
  publisher: string;
  isBBTBook: boolean;
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
  topBooks: { title: string; quantity: number; points: number }[];
  reportsByYear: { year: number; count: number; totalBooks: number; totalPoints: number }[];
}

export class ReportGenerationService {
  /**
   * Generate comprehensive statistics from all reports
   */
  static generateStatistics(reports: MonthlyReport[]): ReportStatistics {
    if (!reports || reports.length === 0) {
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

    const totalBooksForBBTAnalysis = bbtBooks + otherBooks;
    const bbtVsOtherBooks = {
      bbt: bbtBooks,
      other: otherBooks,
      bbtPercentage: totalBooksForBBTAnalysis > 0 ? (bbtBooks / totalBooksForBBTAnalysis) * 100 : 0
    };

    // Monthly breakdown
    const monthlyBreakdown = reports.map(report => ({
      month: report.month,
      year: report.year,
      books: report.totalBooks,
      points: report.totalPoints
    }));

    // Top books
    const topBooks = Object.entries(bookCounts)
      .map(([title, data]) => ({
        title,
        quantity: data.quantity,
        points: data.points
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 20);

    // Reports by year
    const yearData: { [year: number]: { count: number; totalBooks: number; totalPoints: number } } = {};
    reports.forEach(report => {
      if (!yearData[report.year]) {
        yearData[report.year] = { count: 0, totalBooks: 0, totalPoints: 0 };
      }
      yearData[report.year].count++;
      yearData[report.year].totalBooks += report.totalBooks;
      yearData[report.year].totalPoints += report.totalPoints;
    });

    const reportsByYear = Object.entries(yearData)
      .map(([year, data]) => ({
        year: parseInt(year),
        ...data
      }))
      .sort((a, b) => b.year - a.year);

    return {
      totalReports: reports.length,
      totalBooksDistributed,
      totalPointsEarned,
      averageBooksPerReport,
      averagePointsPerReport,
      topPublishers,
      bbtVsOtherBooks,
      monthlyBreakdown,
      topBooks,
      reportsByYear
    };
  }

  /**
   * Generate PDF report
   */
  static async generatePDFReport(
    reports: MonthlyReport[],
    statistics: ReportStatistics,
    reportType: 'summary' | 'detailed' = 'summary'
  ): Promise<string> {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let yPosition = margin;

      // Helper function to add text with word wrap
      const addText = (text: string, fontSize: number = 12, isBold: boolean = false) => {
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        
        const lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
        doc.text(lines, margin, yPosition);
        yPosition += lines.length * (fontSize * 0.4) + 5;
        
        if (yPosition > doc.internal.pageSize.getHeight() - margin) {
          doc.addPage();
          yPosition = margin;
        }
      };

      // Title
      addText('BBT Africa Connect - Book Distribution Report', 18, true);
      addText(`Generated on: ${new Date().toLocaleDateString()}`, 10);
      addText('', 10);

      // Executive Summary
      addText('Executive Summary', 16, true);
      addText(`Total Reports: ${statistics.totalReports}`, 12);
      addText(`Total Books Distributed: ${statistics.totalBooksDistributed.toLocaleString()}`, 12);
      addText(`Total Points Earned: ${statistics.totalPointsEarned.toLocaleString()}`, 12);
      addText(`Average Books per Report: ${statistics.averageBooksPerReport.toFixed(1)}`, 12);
      addText(`BBT Books Percentage: ${statistics.bbtVsOtherBooks.bbtPercentage.toFixed(1)}%`, 12);
      addText('', 10);

      if (reportType === 'detailed') {
        // Top Publishers
        if (statistics.topPublishers.length > 0) {
          addText('Top Publishers', 14, true);
          const publisherData = [
            ['Publisher', 'Books Distributed', 'Percentage'],
            ...statistics.topPublishers.map(p => [
              p.publisher,
              p.count.toString(),
              `${p.percentage.toFixed(1)}%`
            ])
          ];
          
          yPosition = createSimpleTable(doc, publisherData, yPosition, margin) + 10;
        }

        // Top Books
        if (statistics.topBooks.length > 0) {
          addText('Top Distributed Books', 14, true);
          const bookData = [
            ['Book Title', 'Quantity', 'Total Points'],
            ...statistics.topBooks.slice(0, 15).map(b => [
              b.title.length > 40 ? b.title.substring(0, 40) + '...' : b.title,
              b.quantity.toString(),
              b.points.toString()
            ])
          ];
          
          yPosition = createSimpleTable(doc, bookData, yPosition, margin) + 10;
        }
      }

      // Generate file path
      const fileName = `BBT_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      const filePath = Platform.OS === 'web' 
        ? `data:application/pdf;base64,${doc.output('datauristring').split(',')[1]}`
        : `${FileSystem.documentDirectory}${fileName}`;

      if (Platform.OS !== 'web') {
        const pdfOutput = doc.output('datauristring');
        const base64Data = pdfOutput.split(',')[1];
        await FileSystem.writeAsStringAsync(filePath, base64Data, {
          encoding: FileSystem.EncodingType.Base64
        });
      }

      return filePath;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF report: ' + error.message);
    }
  }

  /**
   * Generate Excel report
   */
  static async generateExcelReport(
    reports: MonthlyReport[],
    statistics: ReportStatistics
  ): Promise<string> {
    try {
      const workbook = XLSX.utils.book_new();

      // Summary Sheet
      const summaryData = [
        ['BBT Africa Connect - Book Distribution Report'],
        ['Generated on:', new Date().toLocaleDateString()],
        [''],
        ['Executive Summary'],
        ['Total Reports', statistics.totalReports],
        ['Total Books Distributed', statistics.totalBooksDistributed],
        ['Total Points Earned', statistics.totalPointsEarned],
        ['Average Books per Report', statistics.averageBooksPerReport.toFixed(1)],
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
          ...statistics.topPublishers.map(p => [p.publisher, p.count, p.percentage.toFixed(1) + '%'])
        ];
        const publisherSheet = XLSX.utils.aoa_to_sheet(publisherData);
        XLSX.utils.book_append_sheet(workbook, publisherSheet, 'Top Publishers');
      }

      // Top Books Sheet
      if (statistics.topBooks.length > 0) {
        const bookData = [
          ['Book Title', 'Total Quantity', 'Total Points'],
          ...statistics.topBooks.map(b => [b.title, b.quantity, b.points])
        ];
        const bookSheet = XLSX.utils.aoa_to_sheet(bookData);
        XLSX.utils.book_append_sheet(workbook, bookSheet, 'Top Books');
      }

      // Monthly Breakdown Sheet
      if (statistics.monthlyBreakdown.length > 0) {
        const monthlyData = [
          ['Month', 'Year', 'Books Distributed', 'Points Earned'],
          ...statistics.monthlyBreakdown.map(m => [m.month, m.year, m.books, m.points])
        ];
        const monthlySheet = XLSX.utils.aoa_to_sheet(monthlyData);
        XLSX.utils.book_append_sheet(workbook, monthlySheet, 'Monthly Breakdown');
      }

      // Detailed Reports Sheet
      const detailedData = [
        ['Month', 'Year', 'Total Books', 'Total Points', 'File Name', 'Upload Date'],
        ...reports.map(r => [
          r.month,
          r.year,
          r.totalBooks,
          r.totalPoints,
          r.fileName,
          r.uploadedAt ? (r.uploadedAt.toDate ? r.uploadedAt.toDate().toLocaleDateString() : new Date(r.uploadedAt).toLocaleDateString()) : 'Unknown'
        ])
      ];
      const detailedSheet = XLSX.utils.aoa_to_sheet(detailedData);
      XLSX.utils.book_append_sheet(workbook, detailedSheet, 'All Reports');

      // Generate file
      const fileName = `BBT_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      const filePath = Platform.OS === 'web' 
        ? `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' })}`
        : `${FileSystem.documentDirectory}${fileName}`;

      if (Platform.OS !== 'web') {
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });
        await FileSystem.writeAsStringAsync(filePath, excelBuffer, {
          encoding: FileSystem.EncodingType.Base64
        });
      }

      return filePath;
    } catch (error) {
      console.error('Error generating Excel:', error);
      throw new Error('Failed to generate Excel report: ' + error.message);
    }
  }

  /**
   * Share the generated report file
   */
  static async shareReport(filePath: string, fileName: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // For web, create a download link
        if (filePath.startsWith('data:')) {
          const a = document.createElement('a');
          a.href = filePath;
          a.download = fileName;
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      } else {
        // For mobile, use expo-sharing
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(filePath, {
            mimeType: fileName.endsWith('.pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            dialogTitle: 'Share Report'
          });
        } else {
          throw new Error('Sharing is not available on this device');
        }
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
    try {
      const statistics = this.generateStatistics(reports);
      const filePath = await this.generatePDFReport(reports, statistics, reportType);
      const fileName = `BBT_Book_Distribution_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      await this.shareReport(filePath, fileName);
    } catch (error) {
      console.error('Error in generateAndSharePDF:', error);
      throw error;
    }
  }

  /**
   * Generate and share Excel report
   */
  static async generateAndShareExcel(reports: MonthlyReport[]): Promise<void> {
    try {
      const statistics = this.generateStatistics(reports);
      const filePath = await this.generateExcelReport(reports, statistics);
      const fileName = `BBT_Book_Distribution_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      await this.shareReport(filePath, fileName);
    } catch (error) {
      console.error('Error in generateAndShareExcel:', error);
      throw error;
    }
  }
}