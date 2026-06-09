const fs = require('fs');
let content = fs.readFileSync('src/admin/AdminPanel.tsx', 'utf-8');

const target1 = `                            <span className="text-xs text-slate-400 font-mono">
                              {app.createdAt ? (app.createdAt.seconds ? new Date(app.createdAt.seconds * 1000).toLocaleString('bn-BD') : new Date(app.createdAt).toLocaleString('bn-BD')) : ''}
                    {/* 5. In-depth Test Matrix Details Component in clean Bangla block */}
                <div className="space-y-4">`;

const replacement1 = `                            <span className="text-xs text-slate-400 font-mono">
                              {app.createdAt ? (app.createdAt.seconds ? new Date(app.createdAt.seconds * 1000).toLocaleString('bn-BD') : new Date(app.createdAt).toLocaleString('bn-BD')) : ''}
                            </span>
                          </div>

                          <div className="p-4 bg-white rounded-xl border border-slate-100 space-y-2 mt-3 text-sm">
                            <p className="text-slate-600"><span className="font-bold text-slate-800">আপিলের কারণ:</span> {app.appealReason}</p>
                          </div>

                          {isPending && (
                            <div className="flex items-center justify-end gap-2 border-t border-slate-200/75 pt-3 mt-4">
                              <button
                                onClick={() => handleAppealAction(app.id, app.userId, app.userName, 'approve')}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                              >
                                <ThumbsUp size={14} /> আপিল মঞ্জুর ও সক্রিয় (Approve)
                              </button>
                              <button
                                onClick={() => handleAppealAction(app.id, app.userId, app.userName, 'reject')}
                                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                              >
                                <ThumbsDown size={14} /> আপিল নাকচ (Reject)
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'testing' && (
            <div className="space-y-8">
              {/* 5. In-depth Test Matrix Details Component in clean Bangla block */}
              <div className="space-y-4">`;

content = content.replace(target1, replacement1);

const target2 = `                </div>

              </div>
            );
          })()}

          {activeTab === 'clerk_trust' && (`;

const replacement2 = `                </div>

              </div>
            </div>
          )}

          {activeTab === 'clerk_trust' && (`;

content = content.replace(target2, replacement2);

fs.writeFileSync('src/admin/AdminPanel.tsx', content);
console.log("Fixed appeals mapping block and testing braces!");
