const fs = require('fs');
let content = fs.readFileSync('src/admin/AdminPanel.tsx', 'utf-8');

// Fix the closing bracket issue
content = content.replace("                          )}\n\n                        )}\n                  </main>", "                          )}\n                  </main>");

// Fix the corrupted Mobile Specs issue
const startIndex = content.indexOf('{/* In-depth Responsive Grid');
const endIndex = content.indexOf('{/* Code Snippet Reference');

if(startIndex !== -1 && endIndex !== -1) {
    const originalBlock = content.substring(startIndex, endIndex);
    const fixedBlock = `{/* In-depth Responsive Grid & Breakpoint Specifications in fluent Bangla */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Mobile Specs */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                      <Smartphone size={20} />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-800">১. মোবাইল অপ্টিমাইজেশন</h4>
                      <p className="text-xs text-slate-400">সর্বোচ্চ ১ কলাম, ৩২০px থেকে ৪৮০px পর্যন্ত সম্পূর্ণ রেসপন্সিভ ডিজাইন।</p>
                    </div>
                  </div>
                </div>

              </div>

              `;
    content = content.replace(originalBlock, fixedBlock);
    fs.writeFileSync('src/admin/AdminPanel.tsx', content);
    console.log("Replaced block successfully.");
} else {
    console.log("Could not find start or end index.", startIndex, endIndex);
}
