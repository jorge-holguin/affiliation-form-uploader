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
  aceptaArraigoNacional: boolean
  aceptaRemitirDocumentacion: boolean
  declaraBajoJuramento: boolean
}

export async function generateAffiliationPDF(): Promise<void> {
  // Fetch the markdown content
  try {
    console.log('Iniciando generación de PDF...');
    const response = await fetch('/md/afiliacion-renmip.md');
    if (!response.ok) {
      console.error(`Error al obtener markdown: ${response.status}`);
      throw new Error(`Failed to fetch markdown: ${response.status}`);
    }
    const markdownContent = await response.text();
    console.log('Contenido markdown obtenido, generando PDF...');
    // Process markdown content and generate PDF
    await generatePDFFromMarkdown(markdownContent);
    return Promise.resolve();
  } catch (error) {
    console.error('Error generating PDF from markdown:', error);
    // Fallback to the old PDF generation method if there's an error
    console.log('Usando método alternativo de generación de PDF...');
    generateBasicPDF();
    return Promise.resolve();
  }
}

async function generatePDFFromMarkdown(markdownContent: string): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15;
  const lineHeight = 6.5;
  let yPosition = 15;
  
  // Cargar y agregar el logo
  try {
    const logoResponse = await fetch('/logo.png');
    const logoBlob = await logoResponse.blob();
    const logoBase64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(logoBlob);
    });
    
    // Diseño de cabecera institucional
    const logoSize = 18;
    const logoX = margin + 5;
    const logoY = yPosition;
    
    // Agregar logo a la izquierda
    doc.addImage(logoBase64, 'PNG', logoX, logoY, logoSize, logoSize);
    
    // Título al lado del logo
    const textStartX = logoX + logoSize + 8;
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(139, 21, 56); // Granate RENMIP
    doc.text('RENMIP', textStartX, yPosition + 6);
    
    // Subtítulo debajo del título
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    doc.text('Red Nacional de Técnicos, Sub Oficiales y Licenciados Militares y de Policías', textStartX, yPosition + 11);
    doc.text('que defendieron la Democracia entre 1980 - 1997', textStartX, yPosition + 15);
    
    yPosition += logoSize + 5;
    
    // Línea dorada separadora más gruesa para aspecto institucional
    doc.setDrawColor(139, 21, 56); // Granate
    doc.setLineWidth(1.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    
    // Línea dorada secundaria más fina
    doc.setDrawColor(212, 175, 55); // Dorado
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition + 1.5, pageWidth - margin, yPosition + 1.5);
    
    doc.setDrawColor(0, 0, 0); // Restaurar color
    yPosition += 8;
    
  } catch (error) {
    console.error('Error al cargar el logo:', error);
    // Fallback sin logo
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(139, 21, 56);
    doc.text('FICHA DE AFILIACIÓN RENMIP', pageWidth / 2, yPosition, { align: "center" });
    yPosition += 10;
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    doc.text('Red Nacional de Técnicos, Sub Oficiales y Licenciados Militares y de Policías', pageWidth / 2, yPosition, { align: "center" });
    yPosition += 5;
    doc.text('que defendieron la Democracia entre 1980 - 1997', pageWidth / 2, yPosition, { align: "center" });
    yPosition += 8;
    
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(0.8);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    doc.setDrawColor(0, 0, 0);
    yPosition += 8;
  }
  
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
        line.includes('RENMIP') && line.includes('<p align') ||
        line.includes('<p align="center">') && (line.includes('Red Nacional') || line.includes('<em>'))) {
      return;
    }
    
    // Handle headers
    if (line.startsWith('##')) {
      // End any previous blockquote or list
      inBlockquote = false;
      inList = false;
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      
      if (yPosition > 275) {
        doc.addPage();
        yPosition = 15;
      }
      
      // Add minimal space before headers
      yPosition += 3;
      
      // Extract and format the header text
      const headerText = line.replace(/^##\s+/, '');
      doc.setTextColor(139, 21, 56); // Granate para secciones
      doc.text(headerText, margin, yPosition);
      doc.setTextColor(0, 0, 0); // Reset
      
      // Add a line under the header
      yPosition += 5;
      doc.setDrawColor(212, 175, 55); // Dorado
      doc.setLineWidth(0.3);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      doc.setDrawColor(0, 0, 0); // Reset
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      yPosition += lineHeight;
      return;
    }
    
    // Handle page breaks
    if (line.includes('page-break-after')) {
      doc.addPage();
      yPosition = 15;
      return;
    }
    
    // Handle horizontal rules
    if (line.trim() === '---') {
      if (yPosition > 275) {
        doc.addPage();
        yPosition = 15;
      }
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      doc.setDrawColor(0, 0, 0);
      yPosition += lineHeight;
      return;
    }
    
    // Handle blockquotes
    if (line.trim().startsWith('>')) {
      if (!inBlockquote) {
        // Start of blockquote
        inBlockquote = true;
        if (yPosition > 275) {
          doc.addPage();
          yPosition = 15;
        }
        
        // Add a subtle background for the blockquote
        doc.setFillColor(250, 245, 245); // Light granate background
        doc.rect(margin - 2, yPosition - 5, pageWidth - (margin * 2) + 4, 25, 'F');
        
        // Add a granate line on the left
        doc.setDrawColor(139, 21, 56); // Granate RENMIP line
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
      
      if (yPosition > 275) {
        doc.addPage();
        yPosition = 15;
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
      
      if (yPosition > 275) {
        doc.addPage();
        yPosition = 15;
      }
      
      // Handle form fields (lines with underscores)
      if (cleanLine.includes('_') && !cleanLine.includes('**')) {
        // This is likely a form field
        const fieldText = cleanLine.trim();
        
        // Mejorar la apariencia de los campos de formulario
        if (fieldText.startsWith('_')) {
          // Mejorar la apariencia de los campos de formulario
          doc.setDrawColor(139, 21, 56); // Granate RENMIP para las líneas
          doc.setLineWidth(0.3);
          doc.line(margin, yPosition + 1, pageWidth - margin, yPosition + 1);
          doc.setDrawColor(0, 0, 0); // Restaurar color
          doc.setLineWidth(0.1);
        } else {
          doc.text(fieldText, margin, yPosition);
          
          // Buscar la posición del guión bajo para dibujar la línea
          const underscoreIndex = fieldText.indexOf('_');
          if (underscoreIndex > 0) {
            const labelWidth = doc.getTextWidth(fieldText.substring(0, underscoreIndex));
            const lineStart = margin + labelWidth + 1;
            const lineEnd = Math.min(pageWidth - margin, margin + doc.getTextWidth(fieldText) + 10);
            
            doc.setDrawColor(212, 175, 55); // Dorado RENMIP para las líneas
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
      // Empty line - reduce spacing
      yPosition += lineHeight / 3;
    }
  });
  
  // Save the PDF
  doc.save("ficha-afiliacion-renmip.pdf");
}

// Keep the old PDF generation method as a fallback
function generateBasicPDF(): void {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.width
  const margin = 15
  const lineHeight = 6.5
  let yPosition = 15

  // Header institucional
  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(139, 21, 56) // Granate RENMIP
  doc.text('FICHA DE AFILIACIÓN', pageWidth / 2, yPosition + 5, { align: "center" })
  
  doc.setFontSize(20)
  doc.text('RENMIP', pageWidth / 2, yPosition + 12, { align: "center" })
  
  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(60, 60, 60)
  doc.text('Red Nacional de Técnicos, Sub Oficiales y Licenciados Militares y de Policías', pageWidth / 2, yPosition + 18, { align: "center" })
  doc.text('que defendieron la Democracia entre 1980 - 1997', pageWidth / 2, yPosition + 23, { align: "center" })
  
  yPosition += 28
  
  // Líneas separadoras institucionales
  doc.setDrawColor(139, 21, 56)
  doc.setLineWidth(1.5)
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  
  doc.setDrawColor(212, 175, 55)
  doc.setLineWidth(0.5)
  doc.line(margin, yPosition + 1.5, pageWidth - margin, yPosition + 1.5)
  
  doc.setTextColor(0, 0, 0)
  doc.setDrawColor(0, 0, 0)
  
  yPosition += 8

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
    if (yPosition > 275) {
      doc.addPage()
      yPosition = 15
    }
    doc.text(field, margin, yPosition)
    yPosition += lineHeight
  })

  // Add new page for declarations
  doc.addPage()
  yPosition = 15

  const declarations = [
    "20. ACEPTO QUE LA INFORMACIÓN DETALLADA QUE DESCRITO EN EL PRESENTE",
    "FORMULARIO SON VERDADEROS Y DE INCURRIR EN FALSEDAD ASUMO LAS",
    "RESPONSABILIDADES TANTO CIVILES, COMO PENALES ANTE LA AUTORIDAD",
    "COMPETENTE.",
    "☐ ACEPTO    ☐ NO ACEPTO",
    "",
    "21. EN EL CASO DE PERTENECER A OTRA ASOCIACIÓN, DECLARO MI COMPROMISO",
    "DE PRESENTAR CARTA DE RENUNCIA A ESTA Y ENTREGAR CARTA DE LA MISMA A",
    "'RENMIP'",
    "☐ ACEPTO    ☐ NO ACEPTO",
    "",
    "22. ME COMPROMETO A CUMPLIR CON EL REGLAMENTO Y ESTATUTOS DE 'RENMIP',",
    "DESDE EL MOMENTO DE LA SUSCRIPCIÓN DEL PRESENTE FORMULARIO.",
    "☐ DE ACUERDO    ☐ NO ESTOY DE ACUERDO",
    "",
    "23. ACEPTO QUE 'RENMIP' TENDRÁ DE ACUERDO A SU ESTATUTO Y",
    "REGLAMENTO, ARRAIGO NACIONAL Y QUE SERA REPRESENTADA EN CADA REGIÓN",
    "POR CADA MIEMBRO QUE ACEPTE PERTENECER EN ELLA.",
    "☐ ACEPTO    ☐ NO ACEPTO",
    "",
    "24. ME COMPROMETO A REMITIR TODA DOCUMENTACIÓN QUE REFUERZA LO",
    "DETALLADO EN EL PRESENTE FORMULARIO Y EN CUANTO SEA SOLICITADO POR",
    "RENMIP.",
    "☐ ACEPTO    ☐ NO ACEPTO",
    "",
    "25. DECLARO BAJO JURAMENTO Y EN HONOR A LA VERDAD, QUE LOS DATOS",
    "CONSIGNADOS EN LA PRESENTE FICHA SON FIDEDIGNOS. POR MEDIO DE ESTE",
    "FORMULARIO SOLICITO LA INSCRIPCIÓN EN FORMA LIBRE Y VOLUNTARIA SIN",
    "COACCIONES, PRESIONES, NI AMENAZAS DE NINGUNA ÍNDOLE. Y ME SOMETO AL",
    "ESTATUTO Y DEMÁS NORMAS INTERNAS DE 'RENMIP' EN FÉ DE LO CUAL Y",
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
    if (yPosition > 275) {
      doc.addPage()
      yPosition = 15
    }
    doc.text(declaration, margin, yPosition)
    yPosition += lineHeight
  })

  // Save the PDF
  doc.save("ficha-afiliacion-renmip.pdf")
}
