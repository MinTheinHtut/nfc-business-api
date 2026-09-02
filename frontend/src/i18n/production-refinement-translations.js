import { translations } from './translations.js';

const { en,th,ja } = translations;
Object.assign(en.public,{connecting:'Connecting…',connectingBody:'Saving {name} to your contacts.',connectionSuccessful:'Connection successful',successNamedBody:'{name} has been added to your contacts.',alreadyNamedBody:'{name} is already in your contacts.',autoSaveError:"We couldn't save this connection.",tryAgain:'Try again'});
Object.assign(th.public,{connecting:'กำลังเชื่อมต่อ…',connectingBody:'กำลังบันทึก {name} ลงในรายชื่อผู้ติดต่อ',connectionSuccessful:'เชื่อมต่อสำเร็จ',successNamedBody:'เพิ่ม {name} ลงในรายชื่อผู้ติดต่อแล้ว',alreadyNamedBody:'{name} อยู่ในรายชื่อผู้ติดต่อของคุณแล้ว',autoSaveError:'ไม่สามารถบันทึกการเชื่อมต่อนี้ได้',tryAgain:'ลองอีกครั้ง'});
Object.assign(ja.public,{connecting:'接続中…',connectingBody:'{name}を連絡先に保存しています。',connectionSuccessful:'接続しました',successNamedBody:'{name}を連絡先に追加しました。',alreadyNamedBody:'{name}はすでに連絡先にあります。',autoSaveError:'この接続を保存できませんでした。',tryAgain:'もう一度試す'});
Object.assign(en.exhibitors,{connectionCount:'Connections: {count}',viewConnections:'View connections',hideConnections:'Hide connections',connectedCompanies:'Connected companies',noConnections:'No connected companies yet.',connectionsError:'Connected companies could not be loaded.'});
Object.assign(th.exhibitors,{connectionCount:'การเชื่อมต่อ: {count}',viewConnections:'ดูการเชื่อมต่อ',hideConnections:'ซ่อนการเชื่อมต่อ',connectedCompanies:'บริษัทที่เชื่อมต่อ',noConnections:'ยังไม่มีบริษัทที่เชื่อมต่อ',connectionsError:'ไม่สามารถโหลดบริษัทที่เชื่อมต่อได้'});
Object.assign(ja.exhibitors,{connectionCount:'接続数: {count}',viewConnections:'接続を見る',hideConnections:'接続を閉じる',connectedCompanies:'接続済み企業',noConnections:'接続済み企業はまだありません。',connectionsError:'接続済み企業を読み込めませんでした。'});
en.dashboard.step2='The company is saved automatically when its NFC profile opens.';en.dashboard.step3='Open Contacts to review the company after connecting.';
th.dashboard.step2='ระบบจะบันทึกบริษัทอัตโนมัติเมื่อเปิดโปรไฟล์ NFC';th.dashboard.step3='เปิดรายชื่อผู้ติดต่อเพื่อดูบริษัทหลังเชื่อมต่อ';
ja.dashboard.step2='NFCプロフィールが開くと企業が自動的に保存されます。';ja.dashboard.step3='接続後は連絡先から企業を確認できます。';
