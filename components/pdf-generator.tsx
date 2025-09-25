"use client"

import { jsPDF } from "jspdf"

interface AffiliationFormData {
  apellidosNombres: string
  dni: string
  libretaMilitar: string
  fechaNacimiento: string
  edad: string
  correoElectronico: string
  telefono: string
  direccion: string
  departamentoProvinciaDistrito: string
  contactoEmergencia: string
  gradoInstruccion: string
  arma: string
  ultimoGrado: string
  profesionOficio: string
  centroLabores: string
  usaProtesis: string
  enfermedades: string[]
  intervencionesQuirurgicas: string
  detalleIntervenciones: string
  seguroSalud: string
  aceptaInformacionVeraz: boolean
  aceptaRenunciaOtraAsociacion: boolean
  aceptaReglamentoEstatutos: boolean
  aceptaArraigoNacional: boolean
  aceptaRemitirDocumentacion: boolean
  declaraBajoJuramento: boolean
}

export async function generateAffiliationPDF(): Promise<void> {
  // Fetch the markdown content
  try {
    console.log('Iniciando generación de PDF...');
    const response = await fetch('/md/afiliacion-asolifa.md');
    if (!response.ok) {
      console.error(`Error al obtener markdown: ${response.status}`);
      throw new Error(`Failed to fetch markdown: ${response.status}`);
    }
    const markdownContent = await response.text();
    console.log('Contenido markdown obtenido, generando PDF...');
    // Process markdown content and generate PDF
    generatePDFFromMarkdown(markdownContent);
    return Promise.resolve();
  } catch (error) {
    console.error('Error generating PDF from markdown:', error);
    // Fallback to the old PDF generation method if there's an error
    console.log('Usando método alternativo de generación de PDF...');
    generateBasicPDF();
    return Promise.resolve();
  }
}

function generatePDFFromMarkdown(markdownContent: string): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  const lineHeight = 7;
  let yPosition = 20;
  
  // Add a title at the top with improved styling
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(25, 55, 125); // Azul oscuro para el título
  doc.text('Ficha de Afiliación ASOLIFA.CSS', pageWidth / 2, yPosition, { align: "center" });
  yPosition += 15;
  
  // Add corporation name with improved styling
  doc.setFontSize(13);
  doc.setTextColor(60, 60, 60); // Gris oscuro para el subtítulo
  doc.text('Corporación Nacional de Defensores de la Democracia', pageWidth / 2, yPosition, { align: "center" });
  yPosition += 12;
  
  // Add a line separator with improved styling
  doc.setDrawColor(70, 130, 180); // Azul acero para la línea
  doc.setLineWidth(0.8);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  doc.setDrawColor(0, 0, 0); // Restaurar color de línea a negro
  yPosition += 12;
  
  // Process markdown content by lines
  const lines = markdownContent.split('\n');
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  // Track if we're inside a blockquote for styling
  let inBlockquote = false;
  let inList = false;
  let listIndent = 0;
  
  lines.forEach(line => {
    // Skip HTML comments and header
    if (line.trim().startsWith('<!--') && line.trim().endsWith('-->') ||
        line.includes('REGISTRO DE AFILIACIÓN') ||
        line.includes('ASOLIFA.CSS') ||
        line.includes('<p align="center">')) {
      return;
    }
    
    // Handle headers
    if (line.startsWith('##')) {
      // End any previous blockquote or list
      inBlockquote = false;
      inList = false;
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Add some space before headers
      yPosition += 5;
      
      // Extract and format the header text
      const headerText = line.replace(/^##\s+/, '');
      doc.text(headerText, margin, yPosition);
      
      // Add a line under the header
      yPosition += 7;
      doc.setLineWidth(0.2);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      yPosition += lineHeight;
      return;
    }
    
    // Handle page breaks
    if (line.includes('page-break-after')) {
      doc.addPage();
      yPosition = 20;
      return;
    }
    
    // Handle horizontal rules
    if (line.trim() === '---') {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += lineHeight;
      return;
    }
    
    // Handle blockquotes
    if (line.trim().startsWith('>')) {
      if (!inBlockquote) {
        // Start of blockquote
        inBlockquote = true;
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        
        // Add a blue rectangle for the blockquote background
        doc.setFillColor(240, 247, 250); // Light blue background
        doc.rect(margin - 2, yPosition - 5, pageWidth - (margin * 2) + 4, 25, 'F');
        
        // Add a blue line on the left
        doc.setDrawColor(59, 130, 246); // Blue line
        doc.setLineWidth(3);
        doc.line(margin, yPosition - 5, margin, yPosition + 20);
        doc.setDrawColor(0, 0, 0); // Reset to black
        doc.setLineWidth(0.1);
      }
      
      // Format the blockquote text
      const quoteText = line.replace(/^>\s*/, '').replace(/\*\*/g, '');
      doc.setFont("helvetica", "italic");
      doc.setTextColor(75, 85, 99); // Gray text
      doc.text(quoteText, margin + 5, yPosition);
      doc.setTextColor(0, 0, 0); // Reset to black
      doc.setFont("helvetica", "normal");
      yPosition += lineHeight;
      return;
    } else if (inBlockquote) {
      // End of blockquote
      inBlockquote = false;
      yPosition += 5; // Add some space after blockquote
    }
    
    // Handle lists
    if (line.trim().startsWith('- [ ]') || line.trim().startsWith('- [x]')) {
      if (!inList) {
        inList = true;
        listIndent = line.indexOf('-');
      }
      
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Draw checkbox
      doc.rect(margin + 2, yPosition - 4, 4, 4, 'S');
      
      // If checked, draw an X
      if (line.includes('- [x]')) {
        doc.text('✓', margin + 3, yPosition - 1);
      }
      
      // Format the list item text
      const itemText = line.replace(/^-\s*\[\s?[xX]?\]\s*/, '');
      doc.text(itemText, margin + 8, yPosition);
      yPosition += lineHeight;
      return;
    }
    
    // Handle regular text
    if (line.trim() !== '') {
      // Clean up HTML tags
      const cleanLine = line.replace(/<[^>]*>/g, '');
      
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Handle form fields (lines with underscores)
      if (cleanLine.includes('_') && !cleanLine.includes('**')) {
        // This is likely a form field
        const fieldText = cleanLine.trim();
        
        // Mejorar la apariencia de los campos de formulario
        if (fieldText.startsWith('_')) {
          // Campo de formulario completo
          doc.setDrawColor(100, 150, 200); // Azul claro para las líneas
          doc.setLineWidth(0.3);
          doc.line(margin, yPosition + 1, pageWidth - margin, yPosition + 1);
          doc.setDrawColor(0, 0, 0); // Restaurar color
          doc.setLineWidth(0.1);
        } else {
          // Campo con etiqueta
          doc.text(fieldText, margin, yPosition);
          
          // Buscar la posición del guión bajo para dibujar la línea
          const underscoreIndex = fieldText.indexOf('_');
          if (underscoreIndex > 0) {
            const labelWidth = doc.getTextWidth(fieldText.substring(0, underscoreIndex));
            const lineStart = margin + labelWidth + 1;
            const lineEnd = Math.min(pageWidth - margin, margin + doc.getTextWidth(fieldText) + 10);
            
            doc.setDrawColor(100, 150, 200); // Azul claro para las líneas
            doc.setLineWidth(0.3);
            doc.line(lineStart, yPosition + 1, lineEnd, yPosition + 1);
            doc.setDrawColor(0, 0, 0); // Restaurar color
            doc.setLineWidth(0.1);
          }
        }
      }
      // Handle bold text
      else if (cleanLine.includes('**')) {
        doc.setFont("helvetica", "bold");
        const boldText = cleanLine.replace(/\*\*/g, '');
        doc.text(boldText, margin, yPosition);
        doc.setFont("helvetica", "normal");
      } else {
        doc.text(cleanLine, margin, yPosition);
      }
      
      yPosition += lineHeight;
    } else if (line.trim() === '') {
      // Empty line
      yPosition += lineHeight / 2;
    }
  });
  
  // Save the PDF
  doc.save("ficha-afiliacion-asolifa.pdf");
}

// Keep the old PDF generation method as a fallback
function generateBasicPDF(): void {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.width
  const margin = 20
  const lineHeight = 7
  let yPosition = 30

  // Header
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.text('REGISTRO DE AFILIACION "ASOLIFA.CSS"', pageWidth / 2, 20, { align: "center" })

  yPosition = 40

  // Form fields
  const fields = [
    "1. APELLIDOS Y NOMBRES: _________________________________________________",
    "_____________________________________________________________________",
    "",
    "2. DNI: ________________________",
    "",
    "3. LIBRETA MILITAR: ______________________",
    "",
    "4. FECHA DE NACIMIENTO DD/MM/AA: ____________________________",
    "",
    "5. EDAD: ______________",
    "",
    "6. CORREO ELECTRONICO: _________________________________________________",
    "",
    "7. TELEFONO: _____________________________",
    "",
    "8. DIRECCION: ___________________________________________________________",
    "_____________________________________________________________________",
    "",
    "9. DEPARTAMENTO/PROVINCIA/DISTRITO: _____________________________________",
    "",
    "10. CONTACTO DE EMERGENCIA (Nombre y teléfono):",
    "_____________________________________________________________________",
    "",
    "11. GRADO DE INSTRUCCIÓN:",
    "☐ Primaria    ☐ Secundaria    ☐ Técnico    ☐ Profesional",
    "",
    "12. ARMA:",
    "☐ MGP    ☐ EP    ☐ FAP    ☐ PNP",
    "",
    "13. ULTIMO GRADO OBTENIDO EN LAS FFAA/PNP ___________________________",
    "_____________________________________________________________________",
    "",
    "14. PROFESION/OFICIO (Abogado, albañil, medico, electricista):",
    "_____________________________________________________________________",
    "",
    "15. CENTRO DE LABORES:",
    "☐ Dependiente    ☐ Independiente",
    "",
    "16. USA PROTESIS (SI/NO): ___________________",
    "",
    "17. ENFERMEDADES:",
    "☐ Diabetes    ☐ Asma    ☐ Presión    ☐ Ninguna",
    "☐ Otras: _____________________________________________________________",
    "",
    "18. INTERVENCIONES QUIRURGICAS:",
    "☐ Si    ☐ No",
    "Detallar de ser 'SI': _______________________________________________",
    "",
    "19. CUENTA CON SEGURO DE SALUD: _____________________________________",
  ]

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")

  fields.forEach((field) => {
    if (yPosition > 270) {
      doc.addPage()
      yPosition = 20
    }
    doc.text(field, margin, yPosition)
    yPosition += lineHeight
  })

  // Add new page for declarations
  doc.addPage()
  yPosition = 20

  const declarations = [
    "20. ACEPTO QUE LA INFORMACIÓN DETALLADA QUE DESCRITO EN EL PRESENTE",
    "FORMULARIO SON VERDADEROS Y DE INCURRIR EN FALSEDAD ASUMO LAS",
    "RESPONSABILIDADES TANTO CIVILES, COMO PENALES ANTE LA AUTORIDAD",
    "COMPETENTE.",
    "☐ ACEPTO    ☐ NO ACEPTO",
    "",
    "21. EN EL CASO DE PERTENECER A OTRA ASOCIACIÓN, DECLARO MI COMPROMISO",
    "DE PRESENTAR CARTA DE RENUNCIA A ESTA Y ENTREGAR CARTA DE LA MISMA A",
    "'ASOLIFA.CSS'",
    "☐ ACEPTO    ☐ NO ACEPTO",
    "",
    "22. ME COMPROMETO A CUMPLIR CON EL REGLAMENTO Y ESTATUTOS DE 'ASOLIFA',",
    "DESDE EL MOMENTO DE LA SUSCRIPCIÓN DEL PRESENTE FORMULARIO.",
    "☐ DE ACUERDO    ☐ NO ESTOY DE ACUERDO",
    "",
    "23. ACEPTO QUE 'ASOLIFA.CSS' TENDRÁ DE ACUERDO A SU ESTATUTO Y",
    "REGLAMENTO, ARRAIGO NACIONAL Y QUE SERA REPRESENTADA EN CADA REGIÓN",
    "POR CADA HOMBRE QUE ACEPTE PERTENECER EN ELLA.",
    "☐ ACEPTO    ☐ NO ACEPTO",
    "",
    "24. ME COMPROMETO A REMITIR TODA DOCUMENTACIÓN QUE REFUERZA LO",
    "DETALLADO EN EL PRESENTE FORMULARIO Y EN CUANTO SEA SOLICITADO POR",
    "ASOLIFA CSS.",
    "☐ ACEPTO    ☐ NO ACEPTO",
    "",
    "25. DECLARO BAJO JURAMENTO Y EN HONOR A LA VERDAD, QUE LOS DATOS",
    "CONSIGNADOS EN LA PRESENTE FICHA SON FIDEDIGNOS. POR MEDIO DE ESTE",
    "FORMULARIO SOLICITO LA INSCRIPCIÓN EN FORMA LIBRE Y VOLUNTARIA SIN",
    "COACCIONES, PRESIONES, NI AMENAZAS DE NINGUNA ÍNDOLE. Y ME SOMETO AL",
    "ESTATUTO Y DEMÁS NORMAS INTERNAS DE 'ASOLIFA.CSS' EN FÉ DE LO CUAL Y",
    "EN SEÑAL DE CONFORMIDAD ME SUSCRIBO A LA PRESENTE.",
    "☐ ACEPTO    ☐ NO ACEPTO",
    "",
    "26. ADJUNTAR 'Libreta militar', 'Constancia de baja', 'Resolución de",
    "reconocimiento del Comando Conjunto' en PDF y/u otros documentos que",
    "acrediten haber pertenecido a las FFAA/PNP (Imagen)",
    "",
    "",
    "",
    "FIRMA: _____________________________",
    "",
    "DNI: _______________________________",
  ]

  declarations.forEach((declaration) => {
    if (yPosition > 270) {
      doc.addPage()
      yPosition = 20
    }
    doc.text(declaration, margin, yPosition)
    yPosition += lineHeight
  })

  // Save the PDF
  doc.save("ficha-afiliacion-asolifa.pdf")
}
