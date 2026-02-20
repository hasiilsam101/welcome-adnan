import jsPDF from 'jspdf';

interface PackingSlipItem {
  product_name: string;
  quantity: number;
  unit_price: number;
}

interface PackingSlipData {
  order_number: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  shipping_address: string;
  items: PackingSlipItem[];
  notes?: string | null;
}

export function generatePackingSlip(data: PackingSlipData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('PACKING SLIP', pageWidth / 2, y, { align: 'center' });
  y += 12;

  // Order number & date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Order: ${data.order_number}`, 20, y);
  doc.text(`Date: ${new Date(data.created_at).toLocaleDateString()}`, pageWidth - 20, y, { align: 'right' });
  y += 12;

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(20, y, pageWidth - 20, y);
  y += 10;

  // Ship To
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('SHIP TO:', 20, y);
  y += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(data.customer_name, 20, y);
  y += 6;
  if (data.customer_phone) {
    doc.text(`Phone: ${data.customer_phone}`, 20, y);
    y += 6;
  }
  if (data.shipping_address) {
    const addressLines = doc.splitTextToSize(data.shipping_address, pageWidth - 40);
    addressLines.forEach((line: string) => {
      doc.text(line, 20, y);
      y += 6;
    });
  }
  y += 8;

  // Divider
  doc.line(20, y, pageWidth - 20, y);
  y += 10;

  // Items header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('#', 20, y);
  doc.text('Item', 30, y);
  doc.text('Qty', pageWidth - 50, y, { align: 'right' });
  doc.text('Check', pageWidth - 20, y, { align: 'right' });
  y += 4;
  doc.line(20, y, pageWidth - 20, y);
  y += 6;

  // Items
  doc.setFont('helvetica', 'normal');
  data.items.forEach((item, index) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    doc.text(`${index + 1}`, 20, y);
    
    // Truncate long product names
    const maxWidth = pageWidth - 100;
    const productName = doc.splitTextToSize(item.product_name, maxWidth);
    doc.text(productName[0], 30, y);
    
    doc.text(`${item.quantity}`, pageWidth - 50, y, { align: 'right' });
    
    // Checkbox for warehouse verification
    doc.rect(pageWidth - 25, y - 4, 5, 5);
    
    y += productName.length > 1 ? 12 : 8;
  });

  y += 6;
  doc.line(20, y, pageWidth - 20, y);
  y += 10;

  // Total items
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Items: ${data.items.reduce((sum, item) => sum + item.quantity, 0)}`, 20, y);
  y += 12;

  // Notes
  if (data.notes) {
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', 20, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    const noteLines = doc.splitTextToSize(data.notes, pageWidth - 40);
    noteLines.forEach((line: string) => {
      doc.text(line, 20, y);
      y += 6;
    });
    y += 6;
  }

  // Footer: signature areas
  y = Math.max(y + 10, 240);
  doc.line(20, y, 80, y);
  doc.text('Packed By', 30, y + 6);
  
  doc.line(pageWidth - 80, y, pageWidth - 20, y);
  doc.text('Checked By', pageWidth - 70, y + 6);

  // Save
  doc.save(`packing-slip-${data.order_number}.pdf`);
}
