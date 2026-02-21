import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateBillPDF = (bill, societyName = 'Society Management') => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text(societyName, 14, 22);
  
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text('Maintenance Bill / Invoice', 14, 30);
  
  // Bill Details Left
  doc.setFontSize(10);
  doc.setTextColor(60);
  doc.text(`Bill No: ${bill._id.slice(-8).toUpperCase()}`, 14, 45);
  doc.text(`Bill Month: ${bill.billMonth}`, 14, 52);
  
  const formattedDueDate = new Date(bill.dueDate).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
  doc.text(`Due Date: ${formattedDueDate}`, 14, 59);

  // Flat Details Right
  const flatText = typeof bill.flatId === 'object' 
    ? `${bill.flatId.wing}-${bill.flatId.flatNumber}`
    : 'N/A';
  
  const userText = bill.userId 
    ? `${bill.userId.firstName || ''} ${bill.userId.lastName || ''}`
    : 'Resident';

  doc.text(`Flat: ${flatText}`, 140, 45);
  doc.text(`Billed To: ${userText}`, 140, 52);
  doc.text(`Status: ${bill.status.toUpperCase()}`, 140, 59);

  // Line Separator
  doc.setLineWidth(0.5);
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 65, 196, 65);

  // Table Data
  const tableColumn = ["Sr No.", "Charge Head", "Amount (₹)"];
  const tableRows = [];

  let totalAmount = 0;
  
  if (bill.breakdown && bill.breakdown.length > 0) {
    bill.breakdown.forEach((item, index) => {
      const amount = item.amount || 0;
      totalAmount += amount;
      tableRows.push([
        index + 1,
        item.chargeName,
        `${amount.toLocaleString('en-IN')}.00`
      ]);
    });
  } else {
    // Fallback if breakdown is empty but amount exists
    totalAmount = bill.amount;
    tableRows.push([1, 'Total Maintenance Charges', `${totalAmount.toLocaleString('en-IN')}.00`]);
  }

  // Generate Table
  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 75,
    theme: 'striped',
    headStyles: { fillColor: [108, 99, 255] },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 40, halign: 'right' }
    }
  });

  // Totals Area
  const finalY = doc.lastAutoTable.finalY || 100;
  
  doc.setFontSize(11);
  doc.setTextColor(40);
  doc.setFont('helvetica', 'bold');
  doc.text('Total Payable:', 120, finalY + 15);
  doc.text(`₹ ${totalAmount.toLocaleString('en-IN')}.00`, 170, finalY + 15, { align: 'right' });

  // Footer
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150);
  doc.text('This is a computer generated invoice and does not require a physical signature.', 14, 280);

  // Save the PDF
  doc.save(`Bill_${flatText}_${bill.billMonth.replace(' ', '_')}.pdf`);
};
