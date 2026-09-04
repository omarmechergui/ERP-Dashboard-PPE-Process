import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Generate a professional Formation / Certification Checklist PDF.
 * 
 * @param {Object} testData - The full FormationTest object with items, technicien, superviseur.
 * @param {boolean} filled - If true, generates a filled (post-test) version with scores. If false, generates a blank checklist.
 */
export function generateTestPDF(testData, filled = false) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // ========== HEADER ==========
  doc.setFillColor(30, 64, 175); // blue-800
  doc.rect(0, 0, pageWidth, 38, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('FORMATION & CERTIFICATION', pageWidth / 2, 16, { align: 'center' });

  doc.setFontSize(11);
  doc.text(`Checklist d'Évaluation - ${testData.niveauEvalue}`, pageWidth / 2, 25, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Réf: TEST-${String(testData.id).padStart(4, '0')}`, margin, 33);
  doc.text(`Date: ${new Date(testData.dateTest).toLocaleDateString('fr-FR')}`, pageWidth - margin, 33, { align: 'right' });

  y = 46;

  // ========== TECHNICIAN INFORMATION ==========
  doc.setFillColor(243, 244, 246); // gray-100
  doc.roundedRect(margin, y, contentWidth, 30, 2, 2, 'F');
  doc.setDrawColor(209, 213, 219); // gray-300
  doc.roundedRect(margin, y, contentWidth, 30, 2, 2, 'S');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55); // gray-800
  doc.text('INFORMATIONS DU CANDIDAT', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const col1 = margin + 4;
  const col2 = margin + contentWidth / 2 + 4;
  const lineH = 5.5;

  doc.setFont('helvetica', 'bold');
  doc.text('Nom:', col1, y + 12);
  doc.setFont('helvetica', 'normal');
  doc.text(testData.technicien?.nom || '_______________', col1 + 18, y + 12);

  doc.setFont('helvetica', 'bold');
  doc.text('Matricule:', col2, y + 12);
  doc.setFont('helvetica', 'normal');
  doc.text(testData.technicien?.matricule || '_______________', col2 + 22, y + 12);

  doc.setFont('helvetica', 'bold');
  doc.text('Niveau actuel:', col1, y + 12 + lineH);
  doc.setFont('helvetica', 'normal');
  doc.text(testData.technicien?.currentNiveau || 'Débutant', col1 + 30, y + 12 + lineH);

  doc.setFont('helvetica', 'bold');
  doc.text('Niveau évalué:', col2, y + 12 + lineH);
  doc.setFont('helvetica', 'normal');
  doc.text(testData.niveauEvalue, col2 + 30, y + 12 + lineH);

  doc.setFont('helvetica', 'bold');
  doc.text('Date du test:', col1, y + 12 + lineH * 2);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date(testData.dateTest).toLocaleDateString('fr-FR'), col1 + 26, y + 12 + lineH * 2);

  doc.setFont('helvetica', 'bold');
  doc.text('Superviseur:', col2, y + 12 + lineH * 2);
  doc.setFont('helvetica', 'normal');
  doc.text(testData.superviseur?.nom || '_______________', col2 + 26, y + 12 + lineH * 2);

  y += 38;

  // ========== CHECKLIST TABLE ==========
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(31, 41, 55);
  doc.text('CHECKLIST D\'ÉVALUATION', margin, y);
  y += 3;

  // Group items by category
  const items = testData.items || [];
  const categories = {};
  items.forEach((item, idx) => {
    if (!categories[item.category]) categories[item.category] = [];
    categories[item.category].push({ ...item, globalIndex: idx + 1 });
  });

  const tableBody = [];
  let itemNum = 0;

  Object.keys(categories).forEach(cat => {
    // Category header row
    tableBody.push([
      { content: cat.toUpperCase(), colSpan: 3, styles: { fillColor: [219, 234, 254], fontStyle: 'bold', textColor: [30, 64, 175], fontSize: 8 } }
    ]);

    categories[cat].forEach(item => {
      itemNum++;
      const conformeVal = filled && item.isConforme === true ? '☑' : '☐';
      const nonConformeVal = filled && item.isConforme === false ? '☑' : '☐';
      
      const ptsDisplay = item.required ? `(${item.points} pt${item.points > 1 ? 's' : ''})` : '(Non noté)';

      tableBody.push([
        { content: `${itemNum}. ${item.question} ${ptsDisplay}`, styles: { fontSize: 8 } },
        { content: `${conformeVal} Conforme`, styles: { halign: 'center', fontSize: 8 } },
        { content: `${nonConformeVal} Non Conforme`, styles: { halign: 'center', fontSize: 8 } }
      ]);
    });
  });

  doc.autoTable({
    startY: y,
    margin: { left: margin, right: margin },
    head: [[
      { content: 'Critère d\'évaluation', styles: { fillColor: [30, 64, 175], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' } },
      { content: 'Conforme', styles: { fillColor: [30, 64, 175], textColor: [255, 255, 255], halign: 'center', fontSize: 8, fontStyle: 'bold' } },
      { content: 'Non Conforme', styles: { fillColor: [30, 64, 175], textColor: [255, 255, 255], halign: 'center', fontSize: 8, fontStyle: 'bold' } }
    ]],
    body: tableBody,
    columnStyles: {
      0: { cellWidth: contentWidth * 0.6 },
      1: { cellWidth: contentWidth * 0.2 },
      2: { cellWidth: contentWidth * 0.2 }
    },
    styles: {
      lineColor: [209, 213, 219],
      lineWidth: 0.3,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [30, 64, 175],
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    theme: 'grid'
  });

  y = doc.lastAutoTable.finalY + 8;

  // ========== RESULT SECTION ==========
  // Check if we need a new page
  if (y + 60 > doc.internal.pageSize.getHeight() - margin) {
    doc.addPage();
    y = margin;
  }

  doc.setFillColor(243, 244, 246);
  doc.roundedRect(margin, y, contentWidth, 36, 2, 2, 'F');
  doc.setDrawColor(209, 213, 219);
  doc.roundedRect(margin, y, contentWidth, 36, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(31, 41, 55);
  doc.text('RÉSULTAT', margin + 4, y + 7);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  const totalItems = items.length;
  let totalPossiblePoints = 0;
  let obtainedPoints = 0;
  
  if (filled) {
    items.forEach(i => {
      if (i.required) {
        totalPossiblePoints += i.points || 1;
        if (i.isConforme === true) {
          obtainedPoints += i.points || 1;
        }
      }
    });
  }

  const scoreVal = filled && testData.score != null ? `${testData.score.toFixed(1)}%` : '_____ %';

  doc.text(`Nombre total d'éléments évalués: ${totalItems}`, col1, y + 14);
  doc.text(`Points possibles (éléments requis): ${filled ? totalPossiblePoints : '___'}`, col1, y + 20);
  doc.text(`Points obtenus: ${filled ? obtainedPoints : '___'}`, col1, y + 26);
  doc.text(`Score: ${scoreVal}`, col1, y + 32);
  doc.text('Seuil de réussite: 80%', col1, y + 38);

  // Result checkboxes on right side
  const resultX = col2;
  if (filled && testData.resultat) {
    const passCheck = testData.resultat === 'REUSSI' ? '☑' : '☐';
    const failCheck = testData.resultat === 'ECHOUE' ? '☑' : '☐';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(testData.resultat === 'REUSSI' ? 34 : 220, testData.resultat === 'REUSSI' ? 139 : 38, testData.resultat === 'REUSSI' ? 34 : 38);
    doc.text(`${passCheck} RÉUSSI`, resultX, y + 17);
    doc.text(`${failCheck} ÉCHEC`, resultX, y + 28);
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(107, 114, 128);
    doc.text('☐ RÉUSSI', resultX, y + 17);
    doc.text('☐ ÉCHEC', resultX, y + 28);
  }

  y += 44;

  // ========== COMMENTS & SIGNATURES ==========
  if (y + 50 > doc.internal.pageSize.getHeight() - margin) {
    doc.addPage();
    y = margin;
  }

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text('Commentaires / Observations:', margin, y);
  y += 3;

  doc.setDrawColor(209, 213, 219);
  for (let i = 0; i < 3; i++) {
    y += 6;
    doc.line(margin, y, pageWidth - margin, y);
  }

  y += 14;

  // Signature blocks
  const sigWidth = contentWidth / 2 - 5;

  // Technicien signature
  doc.setFont('helvetica', 'bold');
  doc.text('Signature Technicien', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Nom: ${testData.technicien?.nom || '_______________'}`, margin, y + 6);
  doc.text('Date: ____/____/________', margin, y + 12);
  doc.setDrawColor(156, 163, 175);
  doc.rect(margin, y + 15, sigWidth, 18, 'S');
  doc.setTextColor(156, 163, 175);
  doc.text('Signature', margin + sigWidth / 2, y + 25, { align: 'center' });

  // Superviseur signature
  const sigX2 = margin + contentWidth / 2 + 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(31, 41, 55);
  doc.text('Signature Superviseur', sigX2, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Nom: ${testData.superviseur?.nom || '_______________'}`, sigX2, y + 6);
  doc.text('Date: ____/____/________', sigX2, y + 12);
  doc.setDrawColor(156, 163, 175);
  doc.rect(sigX2, y + 15, sigWidth, 18, 'S');
  doc.setTextColor(156, 163, 175);
  doc.text('Signature', sigX2 + sigWidth / 2, y + 25, { align: 'center' });

  // ========== FOOTER ==========
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(156, 163, 175);
    doc.text(
      `Formation & Certification - TEST-${String(testData.id).padStart(4, '0')} - Page ${i}/${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' }
    );
  }

  // Save the PDF
  const status = filled ? 'Rempli' : 'Vierge';
  doc.save(`Checklist_${testData.niveauEvalue}_TEST-${String(testData.id).padStart(4, '0')}_${status}.pdf`);
}
