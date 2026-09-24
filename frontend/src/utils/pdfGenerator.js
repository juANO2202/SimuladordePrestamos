import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateCreditPdf = (simulationData, userName) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const primaryColor = [15, 23, 42];
  const emeraldAccent = [16, 185, 129];

  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 32, 'F');

  doc.setFillColor(...emeraldAccent);
  doc.rect(0, 32, 210, 3, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  const headerTitle = (simulationData.creditTypeName || 'CRÉDITO CONSUMO ÁGIL BANCO').toUpperCase();
  doc.text(headerTitle, 14, 18);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.text('TABLA DE AMORTIZACIÓN OFICIAL Y DESGRAVAMEN', 14, 25);

  doc.setFontSize(8.5);
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-EC')} | Cliente: ${userName || 'Usuario Autenticado'}`, 120, 25);

  let currentY = 43;

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, currentY, 182, 38, 3, 3, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('RESUMEN DE LA SIMULACIÓN DE CRÉDITO', 18, currentY + 8);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');

  const formattedAmount = Number(simulationData.amount).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const termDisplay = (simulationData.termMonths % 12 === 0 && simulationData.termMonths >= 12)
    ? `${simulationData.termMonths} meses (${simulationData.termMonths / 12} años)`
    : `${simulationData.termMonths} meses`;

  doc.text(`Monto Solicitado: $${formattedAmount}`, 18, currentY + 16);
  doc.text(`Sistema: ${simulationData.amortizationMethodName}`, 18, currentY + 23);
  doc.text(`Plazo: ${termDisplay}`, 18, currentY + 30);

  const periodicityText = simulationData.periodicity.includes('30')
    ? 'Mensual (cada 30 días)'
    : simulationData.periodicity;

  doc.text(`Tasa Anual (TEA): ${simulationData.annualInterestRate}%`, 78, currentY + 16);
  doc.text(`Seguro Desgravamen: 0.06% mensual`, 78, currentY + 23);
  doc.text(`Periodicidad: ${periodicityText}`, 78, currentY + 30);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  const formattedPayment = Number(simulationData.initialMonthlyPayment).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  doc.text(`Cuota Mensual: $${formattedPayment}`, 138, currentY + 16);

  doc.setTextColor(217, 119, 6);
  const formattedInterest = Number(simulationData.totalInterest).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  doc.text(`Total Interés: $${formattedInterest}`, 138, currentY + 23);

  doc.setTextColor(16, 185, 129);
  const formattedTotalPaid = Number(simulationData.totalAmountPaid).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  doc.text(`Total a Pagar: $${formattedTotalPaid}`, 138, currentY + 30);

  currentY += 45;

  const tableHeaders = [['No. Cuota', 'Saldo Inicial', 'Capital', 'Interés', 'Desgravamen', 'Cuota Total', 'Saldo Final']];
  const tableData = simulationData.schedule.map(row => [
    row.month,
    `$${Number(row.initialBalance).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `$${Number(row.capitalPaid).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `$${Number(row.interestPaid).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `$${Number(row.desgravamen).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `$${Number(row.payment).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `$${Number(row.remainingBalance).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  ]);

  doc.autoTable({
    startY: currentY,
    head: tableHeaders,
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 8
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 16 },
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right', fontStyle: 'bold' },
      6: { halign: 'right' }
    },
    styles: {
      fontSize: 8,
      cellPadding: 2
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    }
  });

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Página ${i} de ${pageCount} - Documento generado informativamente por el Simulador de Préstamos. Sujeto a políticas de aprobación crediticia.`,
      14,
      288
    );
  }

  doc.save(`Simulacion_Prestamo_${simulationData.creditTypeName.replace(/\s+/g, '_')}.pdf`);
};
