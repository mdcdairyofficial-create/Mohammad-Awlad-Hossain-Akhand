import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { Case } from '../types';

// Helper to convert English digits to Bengali digits
export const toBengaliNum = (num: number | string): string => {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, (w) => bnDigits[parseInt(w, 10)]);
};

// Bengali month names
const bnMonthNames = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

const bnDaysOfWeek = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];

/**
 * Renders an HTML string in an off-screen container, converts to high-res PNG,
 * and compiles into an A4 PDF for instant download.
 */
async function generateAndDownloadPdfFromHtml(
  htmlContent: string,
  fileName: string
): Promise<void> {
  // Create offscreen container
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '-99999px';
  container.style.left = '-99999px';
  container.style.width = '794px'; // Standard A4 width at 96 DPI
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.fontFamily = "'Hind Siliguri', 'Segoe UI', Tahoma, Arial, sans-serif";
  container.style.padding = '0';
  container.style.margin = '0';
  container.style.zIndex = '-9999';
  container.innerHTML = htmlContent;

  document.body.appendChild(container);

  try {
    // Wait for any web fonts and images to settle
    await new Promise((resolve) => setTimeout(resolve, 250));

    const dataUrl = await toPng(container, {
      quality: 0.98,
      pixelRatio: 2,
      backgroundColor: '#ffffff'
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const img = new Image();
    img.src = dataUrl;
    await new Promise((resolve) => {
      img.onload = resolve;
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth;
    const imgHeight = (img.height * pdfWidth) / img.width;

    let heightLeft = imgHeight;
    let position = 0;

    // First page
    pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pdfHeight;

    // Additional pages if content spans beyond 1 A4 page
    while (heightLeft > 2) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;
    }

    pdf.save(fileName);
  } catch (error) {
    console.warn('PDF direct canvas generation fallback:', error);
    // Fallback: Open clean printable window
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="bn">
        <head>
          <meta charset="UTF-8">
          <title>${fileName}</title>
          <style>
            body { font-family: 'Hind Siliguri', sans-serif; padding: 20px; color: #1e293b; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          ${htmlContent}
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}

/**
 * 1. নির্দিষ্ট একটি মামলার সম্পূর্ণ ইতিহাস ও আদেশনামা PDF
 */
export async function downloadCaseHistoryPdf(
  caseData: Case,
  lawyerName: string = 'বিজ্ঞ আইনজীবী',
  chamberName: string = 'এমডিসি কেসবুক চেম্বার'
): Promise<void> {
  const historyList = caseData.history || [];
  const currentDateBn = new Date().toLocaleDateString('bn-BD', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const html = `
    <div style="padding: 36px 40px; font-family: 'Hind Siliguri', 'Segoe UI', Tahoma, Arial, sans-serif; line-height: 1.5; color: #0f172a; background: #ffffff;">
      <!-- Header with Logo / Branding -->
      <div style="border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 24px;">⚖️</span>
            <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #1e3a8a; letter-spacing: -0.5px;">
              MDC Casebook (এমডিসি কেসবুক)
            </h1>
          </div>
          <p style="margin: 4px 0 0 0; font-size: 11px; color: #64748b; font-weight: 600;">
            ডিজিটাল কেস ম্যানেজমেন্ট ও কোর্ট ডায়েরি সিস্টেম | www.mdccasebook.com
          </p>
        </div>
        <div style="text-align: right;">
          <span style="display: inline-block; background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px;">
            মামলার পূর্ণাঙ্গ ইতিহাস ও আদেশনামা
          </span>
          <p style="margin: 6px 0 0 0; font-size: 10px; color: #64748b;">
            রিপোর্ট তৈরির তারিখ: <strong>${currentDateBn}</strong>
          </p>
        </div>
      </div>

      <!-- Case Primary Information Grid -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; font-size: 12px;">
          <div>
            <span style="color: #64748b; font-weight: 600;">মামলা নম্বর:</span>
            <strong style="color: #0f172a; font-size: 14px; margin-left: 6px;">${caseData.caseNumber}</strong>
          </div>
          <div>
            <span style="color: #64748b; font-weight: 600;">আদালতের নাম:</span>
            <strong style="color: #0f172a; margin-left: 6px;">${caseData.courtName || 'আদালত উল্লেখ নেই'} ${caseData.courtNumber ? `(কোর্ট নং: ${caseData.courtNumber})` : ''}</strong>
          </div>
          <div>
            <span style="color: #64748b; font-weight: 600;">মামলার ধরন:</span>
            <strong style="color: ${caseData.caseType === 'Civil' ? '#2563eb' : '#dc2626'}; margin-left: 6px;">
              ${caseData.caseType === 'Civil' ? 'দেওয়ানী মোকদ্দমা (Civil)' : 'ফৌজদারী মামলা (Criminal)'}
            </strong>
          </div>
          <div>
            <span style="color: #64748b; font-weight: 600;">জেলা ও থানা:</span>
            <strong style="color: #0f172a; margin-left: 6px;">${caseData.district || 'জেলা প্রযোজ্য নয়'}${caseData.policeStation ? `, ${caseData.policeStation}` : ''}</strong>
          </div>
          <div>
            <span style="color: #64748b; font-weight: 600;">বাদী / দরখাস্তকারী:</span>
            <strong style="color: #0f172a; margin-left: 6px;">${caseData.petitioner || 'বাদী উল্লেখ নেই'} ${caseData.petitionerMobile ? `(${caseData.petitionerMobile})` : ''}</strong>
          </div>
          <div>
            <span style="color: #64748b; font-weight: 600;">বিবাদী / আসামী:</span>
            <strong style="color: #0f172a; margin-left: 6px;">${caseData.respondent || 'বিবাদী উল্লেখ নেই'} ${caseData.respondentMobile ? `(${caseData.respondentMobile})` : ''}</strong>
          </div>
          <div>
            <span style="color: #64748b; font-weight: 600;">দায়িত্বপ্রাপ্ত আইনজীবী:</span>
            <strong style="color: #0f172a; margin-left: 6px;">${lawyerName || 'আইনজীবী'}</strong>
          </div>
          <div>
            <span style="color: #64748b; font-weight: 600;">পরবর্তী ধার্য তারিখ ও কার্যক্রম:</span>
            <span style="background: #fef3c7; color: #92400e; font-weight: 700; padding: 2px 8px; border-radius: 4px; margin-left: 6px;">
              ${caseData.nextDate || 'তারিখ ধার্য নেই'} - ${caseData.status || caseData.order || 'হাজিরা'}
            </span>
          </div>
        </div>
      </div>

      <!-- History Table Header -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
        <h3 style="margin: 0; font-size: 14px; font-weight: 800; color: #1e293b;">
          📋 আদালতের সকল ধার্য তারিখ ও আদেশনামার ইতিহাস (${toBengaliNum(historyList.length)} টি রেকর্ড)
        </h3>
        <span style="font-size: 11px; color: #64748b;">ধারাবাহিক কালানুক্রমিক বিবরণ</span>
      </div>

      <!-- History Table -->
      <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 24px;">
        <thead>
          <tr style="background: #1e3a8a; color: #ffffff; text-align: left;">
            <th style="padding: 9px 10px; border: 1px solid #1e3a8a; width: 40px; text-align: center;">নং</th>
            <th style="padding: 9px 10px; border: 1px solid #1e3a8a; width: 95px;">ধার্য তারিখ</th>
            <th style="padding: 9px 10px; border: 1px solid #1e3a8a; width: 110px;">কার্যক্রম / পর্যায়</th>
            <th style="padding: 9px 10px; border: 1px solid #1e3a8a; width: 95px;">পরবর্তী তারিখ</th>
            <th style="padding: 9px 10px; border: 1px solid #1e3a8a;">আদালতের আদেশ ও সংক্ষিপ্ত বিবরণ</th>
            <th style="padding: 9px 10px; border: 1px solid #1e3a8a; width: 85px;">পদক্ষেপকারী</th>
          </tr>
        </thead>
        <tbody>
          ${
            historyList.length === 0
              ? `
              <tr>
                <td colspan="6" style="padding: 24px; text-align: center; border: 1px solid #e2e8f0; color: #64748b;">
                  এই মামলায় এখনও কোনো পূর্ববর্তী আদেশ বা ইতিহাস এন্ট্রি করা হয়নি।<br/>
                  <span style="font-size: 10px; color: #94a3b8;">সর্বশেষ আপডেট: ${caseData.lastDate || 'N/A'} | আগামী তারিখ: ${caseData.nextDate || 'N/A'}</span>
                </td>
              </tr>
            `
              : historyList
                  .map(
                    (entry, idx) => `
              <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: 700; color: #64748b;">
                  ${toBengaliNum(idx + 1)}
                </td>
                <td style="padding: 8px 10px; border: 1px solid #e2e8f0; font-weight: 700; color: #1e293b;">
                  ${entry.date || '-'}
                </td>
                <td style="padding: 8px 10px; border: 1px solid #e2e8f0; font-weight: 600; color: #2563eb;">
                  ${entry.status || entry.step || 'হাজিরা'}
                </td>
                <td style="padding: 8px 10px; border: 1px solid #e2e8f0; font-weight: 700; color: #047857;">
                  ${entry.nextDate || '-'}
                </td>
                <td style="padding: 8px 10px; border: 1px solid #e2e8f0; color: #334155; line-height: 1.4;">
                  ${entry.order || entry.description || '-'}
                </td>
                <td style="padding: 8px 10px; border: 1px solid #e2e8f0; font-weight: 600; color: #475569;">
                  ${
                    entry.actionBy === 'court'
                      ? '🏛️ আদালত'
                      : entry.actionBy === 'petitioner' || entry.actionBy === 'lawyer'
                      ? '⚖️ বাদী পক্ষ'
                      : entry.actionBy === 'clerk'
                      ? '✍️ মুহুরী'
                      : entry.actionBy === 'respondent' || entry.actionBy === 'accused'
                      ? '🛡️ বিবাদী পক্ষ'
                      : 'অ্যাডমিন'
                  }
                </td>
              </tr>
            `
                  )
                  .join('')
          }
        </tbody>
      </table>

      <!-- Summary & Verification Box -->
      <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 14px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #64748b;">
        <div>
          <p style="margin: 0 0 4px 0;">
            * এই রিপোর্টটি এমডিসি কেসবুক (MDC Casebook) অনলাইন প্ল্যাটফর্ম থেকে তৈরি করা হয়েছে।
          </p>
          <p style="margin: 0;">
            মক্কেলদের রিয়েল-টাইম কেস ট্র্যাকিং লিংক: <strong>www.mdccasebook.com/track</strong>
          </p>
        </div>
        <div style="text-align: right;">
          <div style="border-bottom: 1px dashed #94a3b8; width: 140px; margin-bottom: 4px;"></div>
          <p style="margin: 0; font-weight: 700; color: #1e293b;">আইনজীবীর স্বাক্ষর ও সীল</p>
          <p style="margin: 2px 0 0 0; color: #64748b;">${chamberName}</p>
        </div>
      </div>
    </div>
  `;

  const safeFileName = `Case_${String(caseData.caseNumber).replace(/[\s/\\:*?"<>|]/g, '_')}_History.pdf`;
  await generateAndDownloadPdfFromHtml(html, safeFileName);
}

/**
 * 2. নির্দিষ্ট একটি মাসের কোর্ট ডায়েরির সামারি PDF
 */
export async function downloadMonthlyDiaryPdf(
  cases: Case[],
  year: number,
  month: number, // 0-indexed (0 = Jan, 9 = Oct)
  lawyerName: string = 'বিজ্ঞ আইনজীবী',
  chamberName: string = 'এমডিসি কেসবুক চেম্বার'
): Promise<void> {
  const monthNameBn = bnMonthNames[month] || `মাস ${month + 1}`;
  const monthStrPadded = String(month + 1).padStart(2, '0');
  const yearStr = String(year);

  // Filter cases scheduled in this year and month
  // We check case.nextDate (YYYY-MM-DD format) or dates inside history
  const monthlyCasesMap: { [dateStr: string]: Case[] } = {};

  cases.forEach((c) => {
    // Check if nextDate is in this month
    if (c.nextDate && c.nextDate.startsWith(`${yearStr}-${monthStrPadded}`)) {
      if (!monthlyCasesMap[c.nextDate]) monthlyCasesMap[c.nextDate] = [];
      if (!monthlyCasesMap[c.nextDate].some((existing) => existing.id === c.id)) {
        monthlyCasesMap[c.nextDate].push(c);
      }
    }

    // Also check history entries for this month
    if (c.history && Array.isArray(c.history)) {
      c.history.forEach((h) => {
        const hDate = h.date;
        if (hDate && hDate.startsWith(`${yearStr}-${monthStrPadded}`)) {
          if (!monthlyCasesMap[hDate]) monthlyCasesMap[hDate] = [];
          if (!monthlyCasesMap[hDate].some((existing) => existing.id === c.id)) {
            monthlyCasesMap[hDate].push(c);
          }
        }
      });
    }
  });

  const sortedDates = Object.keys(monthlyCasesMap).sort();
  const totalScheduledHearings = sortedDates.reduce(
    (acc, d) => acc + monthlyCasesMap[d].length,
    0
  );

  let civilCount = 0;
  let criminalCount = 0;
  sortedDates.forEach((d) => {
    monthlyCasesMap[d].forEach((c) => {
      if (c.caseType === 'Civil') civilCount++;
      else criminalCount++;
    });
  });

  const currentDateBn = new Date().toLocaleDateString('bn-BD', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const html = `
    <div style="padding: 36px 40px; font-family: 'Hind Siliguri', 'Segoe UI', Tahoma, Arial, sans-serif; line-height: 1.5; color: #0f172a; background: #ffffff;">
      <!-- Report Header -->
      <div style="border-bottom: 2px solid #059669; padding-bottom: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 24px;">📅</span>
            <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #065f46; letter-spacing: -0.5px;">
              মাসিক কোর্ট ডায়েরি ও শুনানীর বিবরণী
            </h1>
          </div>
          <p style="margin: 4px 0 0 0; font-size: 11px; color: #64748b; font-weight: 600;">
            MDC Casebook (এমডিসি কেসবুক) | ডিজিটাল লিগ্যাল ম্যানেজমেন্ট সিস্টেম
          </p>
        </div>
        <div style="text-align: right;">
          <span style="display: inline-block; background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; font-size: 12px; font-weight: 800; padding: 4px 12px; border-radius: 6px;">
            ${monthNameBn} ${toBengaliNum(year)}
          </span>
          <p style="margin: 6px 0 0 0; font-size: 10px; color: #64748b;">
            রিপোর্ট তৈরির তারিখ: <strong>${currentDateBn}</strong>
          </p>
        </div>
      </div>

      <!-- Lawyer & Chamber Info Bar -->
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 14px 18px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; font-size: 12px;">
        <div>
          <span style="color: #64748b; font-weight: 600;">আইনজীবী:</span>
          <strong style="color: #065f46; font-size: 13px; margin-left: 6px;">${lawyerName}</strong>
          <span style="color: #94a3b8; margin: 0 8px;">|</span>
          <span style="color: #64748b; font-weight: 600;">চেম্বার:</span>
          <strong style="color: #1e293b; margin-left: 6px;">${chamberName}</strong>
        </div>
        <div style="display: flex; gap: 12px; font-weight: 700;">
          <span style="color: #047857;">মোট ধার্য্য: ${toBengaliNum(totalScheduledHearings)} টি</span>
          <span style="color: #2563eb;">দেওয়ানী: ${toBengaliNum(civilCount)}</span>
          <span style="color: #dc2626;">ফৌজদারী: ${toBengaliNum(criminalCount)}</span>
        </div>
      </div>

      ${
        sortedDates.length === 0
          ? `
          <div style="padding: 40px; text-align: center; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; color: #64748b; margin-bottom: 24px;">
            <p style="font-size: 14px; font-weight: 700; margin: 0 0 6px 0;">${monthNameBn} ${toBengaliNum(year)} মাসে কোনো ধার্য্য মামলা পাওয়া যায়নি।</p>
            <p style="font-size: 11px; margin: 0;">নতুন কোনো মামলার তারিখ এই মাসে ধার্য করা হলে স্বয়ংক্রিয়ভাবে তালিকায় অন্তর্ভুক্ত হবে।</p>
          </div>
        `
          : sortedDates
              .map((dateStr) => {
                const dayCases = monthlyCasesMap[dateStr];
                const dateObj = new Date(dateStr);
                const dayOfWeek = isNaN(dateObj.getTime())
                  ? ''
                  : bnDaysOfWeek[dateObj.getDay()];

                return `
            <div style="margin-bottom: 18px; page-break-inside: avoid;">
              <!-- Day Header -->
              <div style="background: #e2e8f0; padding: 6px 12px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; font-size: 11px; margin-bottom: 6px;">
                <div style="font-weight: 800; color: #1e293b;">
                  🗓️ ${dateStr} (${dayOfWeek})
                </div>
                <span style="font-weight: 700; color: #475569;">
                  ${toBengaliNum(dayCases.length)} টি মামলা ধার্য
                </span>
              </div>

              <!-- Day Cases Table -->
              <table style="width: 100%; border-collapse: collapse; font-size: 10.5px; margin-bottom: 6px;">
                <thead>
                  <tr style="background: #f1f5f9; color: #475569; text-align: left; font-size: 10px;">
                    <th style="padding: 6px 8px; border: 1px solid #cbd5e1; width: 30px; text-align: center;">ক্র</th>
                    <th style="padding: 6px 8px; border: 1px solid #cbd5e1; width: 95px;">মামলা নং</th>
                    <th style="padding: 6px 8px; border: 1px solid #cbd5e1; width: 115px;">আদালত</th>
                    <th style="padding: 6px 8px; border: 1px solid #cbd5e1;">পক্ষগণ (বাদী বনাম বিবাদী)</th>
                    <th style="padding: 6px 8px; border: 1px solid #cbd5e1; width: 90px;">পর্যায় / পদক্ষেপ</th>
                    <th style="padding: 6px 8px; border: 1px solid #cbd5e1; width: 90px;">পরবর্তী ধার্য</th>
                  </tr>
                </thead>
                <tbody>
                  ${dayCases
                    .map(
                      (c, cIdx) => `
                    <tr style="background: ${cIdx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                      <td style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: center; color: #64748b;">
                        ${toBengaliNum(cIdx + 1)}
                      </td>
                      <td style="padding: 6px 8px; border: 1px solid #e2e8f0; font-weight: 700; color: #0f172a;">
                        ${c.caseNumber}
                        <div style="font-size: 8.5px; color: ${c.caseType === 'Civil' ? '#2563eb' : '#dc2626'}; font-weight: 700;">
                          ${c.caseType}
                        </div>
                      </td>
                      <td style="padding: 6px 8px; border: 1px solid #e2e8f0; color: #334155;">
                        ${c.courtName || '-'} ${c.courtNumber ? `(${c.courtNumber})` : ''}
                      </td>
                      <td style="padding: 6px 8px; border: 1px solid #e2e8f0; color: #1e293b; line-height: 1.3;">
                        <strong>${c.petitioner || 'বাদী'}</strong> বনাম <strong>${c.respondent || 'বিবাদী'}</strong>
                      </td>
                      <td style="padding: 6px 8px; border: 1px solid #e2e8f0; font-weight: 700; color: #2563eb;">
                        ${c.status || c.order || 'হাজিরা'}
                      </td>
                      <td style="padding: 6px 8px; border: 1px solid #e2e8f0; font-weight: 600; color: #047857;">
                        ${c.nextDate || '-'}
                      </td>
                    </tr>
                  `
                    )
                    .join('')}
                </tbody>
              </table>
            </div>
          `;
              })
              .join('')
      }

      <!-- Footer -->
      <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 14px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #64748b; margin-top: 16px;">
        <div>
          <p style="margin: 0 0 3px 0;">
            * MDC Casebook অনলাইন কোর্ট ডায়েরি সিস্টেম দ্বারা সংরক্ষিত।
          </p>
          <p style="margin: 0;">
            সার্ভার পোর্টাল: <strong>www.mdccasebook.com</strong> | হেল্পলাইন ও সাপোর্ট সক্রিয়
          </p>
        </div>
        <div style="text-align: right;">
          <div style="border-bottom: 1px dashed #94a3b8; width: 140px; margin-bottom: 4px;"></div>
          <p style="margin: 0; font-weight: 700; color: #1e293b;">আইনজীবীর স্বাক্ষর</p>
        </div>
      </div>
    </div>
  `;

  const safeFileName = `Court_Diary_${monthNameBn}_${year}.pdf`;
  await generateAndDownloadPdfFromHtml(html, safeFileName);
}
