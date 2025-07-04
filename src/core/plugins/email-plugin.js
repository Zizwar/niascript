// plugins/email-plugin.js - Email Plugin مع ردود وهمية
import { BasePlugin } from '../src/core/base-plugin.js';

export default class EmailPlugin extends BasePlugin {
  constructor() {
    super('email');
    this.capabilities = ['send', 'read', 'list', 'delete', 'compose'];
    
    // قاعدة بيانات وهمية للرسائل
    this.mockEmails = [
      {
        id: 1,
        from: 'ahmed@example.com',
        to: 'me@example.com',
        subject: 'مرحباً، كيف حالك؟',
        body: 'أتمنى أن تكون بخير. أريد أن أناقش معك مشروع جديد.',
        date: new Date('2024-01-15T10:30:00'),
        read: false,
        important: true
      },
      {
        id: 2,
        from: 'sara@company.com',
        to: 'me@example.com',
        subject: 'Meeting Tomorrow',
        body: 'Just a reminder about our meeting tomorrow at 2 PM.',
        date: new Date('2024-01-14T14:20:00'),
        read: true,
        important: false
      },
      {
        id: 3,
        from: 'newsletter@tech.com',
        to: 'me@example.com',
        subject: 'Weekly Tech News',
        body: 'Here are the latest tech news and updates for this week...',
        date: new Date('2024-01-13T08:00:00'),
        read: false,
        important: false
      },
      {
        id: 4,
        from: 'mom@family.com',
        to: 'me@example.com',
        subject: 'عشاء العائلة يوم الجمعة',
        body: 'لا تنسى عشاء العائلة يوم الجمعة الساعة 7 مساءً',
        date: new Date('2024-01-12T16:45:00'),
        read: true,
        important: true
      }
    ];
    
    // إعدادات وهمية للمستخدم
    this.userSettings = {
      email: 'me@example.com',
      name: 'المستخدم',
      signature: 'أطيب التحيات،\nالمستخدم',
      autoReply: false
    };

    // قائمة جهات الاتصال الوهمية
    this.contacts = {
      'أحمد': 'ahmed@example.com',
      'ahmed': 'ahmed@example.com',
      'سارة': 'sara@company.com',
      'sara': 'sara@company.com',
      'أمي': 'mom@family.com',
      'mom': 'mom@family.com',
      'والدي': 'dad@family.com',
      'dad': 'dad@family.com',
      'العمل': 'work@company.com',
      'work': 'work@company.com',
      'المدير': 'manager@company.com',
      'manager': 'manager@company.com'
    };
  }

  async execute(intent, context) {
    const startTime = Date.now();
    
    try {
      const result = await this.handleEmailAction(intent, context);
      
      const duration = Date.now() - startTime;
      this.logUsage(context, intent.action, { duration });
      
      return {
        success: true,
        data: result,
        source: 'email-plugin',
        executionTime: duration
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      context.logger.logError(`email-plugin-error`, error, duration);
      
      return {
        success: false,
        message: `خطأ في خدمة البريد الإلكتروني: ${error.message}`,
        suggestion: 'تحقق من تفاصيل البريد الإلكتروني وحاول مرة أخرى',
        fallbackToGeneralAI: true,
        originalError: error.message
      };
    }
  }

  async handleEmailAction(intent, context) {
    const { action, entities } = intent;
    const { target, parameters } = entities;

    switch (action) {
      case 'send':
        return await this.sendEmail(target, parameters, context);
      
      case 'read':
        return await this.readEmails(target, parameters, context);
      
      case 'list':
        return await this.listEmails(parameters, context);
      
      case 'delete':
        return await this.deleteEmail(target, parameters, context);
      
      case 'compose':
        return await this.composeEmail(target, parameters, context);
      
      default:
        return await this.getEmailSummary(context);
    }
  }

  async sendEmail(recipient, params, context) {
    const { subject, body, cc, bcc } = params || {};
    
    // تطبيع اسم المستلم
    const recipientEmail = this.resolveRecipient(recipient);
    
    // إنشاء رسالة وهمية
    const newEmail = {
      id: this.mockEmails.length + 1,
      from: this.userSettings.email,
      to: recipientEmail,
      subject: subject || 'رسالة جديدة',
      body: body || 'مرحباً، كيف حالك؟',
      date: new Date(),
      sent: true,
      cc: cc || [],
      bcc: bcc || []
    };

    // محاكاة إرسال
    await this.simulateEmailSending();
    
    // إضافة للرسائل المرسلة
    this.mockEmails.push(newEmail);

    // ردود مختلفة حسب المستلم
    const responses = {
      'ahmed@example.com': 'تم إرسال الرسالة لأحمد بنجاح! 📧',
      'sara@company.com': 'Email sent to Sara successfully! 📧',
      'mom@family.com': 'تم إرسال الرسالة لأمي بنجاح! ❤️',
      'work@company.com': 'Work email sent successfully! 💼'
    };

    const response = responses[recipientEmail] || 
      `تم إرسال الرسالة إلى ${recipientEmail} بنجاح! 📧`;

    return `${response}
📋 التفاصيل:
• المستلم: ${recipientEmail}
• الموضوع: ${newEmail.subject}
• تاريخ الإرسال: ${newEmail.date.toLocaleString('ar-SA')}
• حالة التسليم: ✅ تم التسليم`;
  }

  async readEmails(emailId, params, context) {
    if (emailId && !isNaN(emailId)) {
      // قراءة رسالة محددة
      const email = this.mockEmails.find(e => e.id == emailId);
      if (!email) {
        return `لم يتم العثور على رسالة برقم ${emailId}`;
      }

      // تحديد الرسالة كمقروءة
      email.read = true;

      return `📧 الرسالة #${email.id}:
👤 من: ${email.from}
📝 الموضوع: ${email.subject}
📅 التاريخ: ${email.date.toLocaleString('ar-SA')}
${email.important ? '⭐ مهمة' : ''}

💬 المحتوى:
${email.body}

${email.read ? '✅ مقروءة' : '🆕 جديدة'}`;
    }

    // قراءة آخر الرسائل
    const limit = params?.limit || 3;
    const unreadOnly = params?.unread || false;
    
    let emails = [...this.mockEmails]
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    if (unreadOnly) {
      emails = emails.filter(e => !e.read);
    }

    emails = emails.slice(0, limit);

    if (emails.length === 0) {
      return unreadOnly ? 'لا توجد رسائل غير مقروءة! 🎉' : 'لا توجد رسائل';
    }

    const emailList = emails.map(email => {
      const status = email.read ? '✅' : '🆕';
      const importance = email.important ? '⭐' : '  ';
      return `${status} ${importance} #${email.id} | ${email.from} | ${email.subject}`;
    }).join('\n');

    return `📬 ${unreadOnly ? 'الرسائل غير المقروءة' : 'آخر الرسائل'} (${emails.length}):

${emailList}

💡 استخدم "اقرأ رسالة #رقم" لقراءة رسالة محددة`;
  }

  async listEmails(params, context) {
    const { folder = 'inbox', limit = 5, search } = params || {};
    
    let emails = [...this.mockEmails];

    // البحث في الرسائل
    if (search) {
      const searchLower = search.toLowerCase();
      emails = emails.filter(email => 
        email.subject.toLowerCase().includes(searchLower) ||
        email.body.toLowerCase().includes(searchLower) ||
        email.from.toLowerCase().includes(searchLower)
      );
    }

    // ترتيب حسب التاريخ
    emails.sort((a, b) => new Date(b.date) - new Date(a.date));
    emails = emails.slice(0, limit);

    if (emails.length === 0) {
      return search ? 
        `لم يتم العثور على نتائج للبحث: "${search}"` :
        'لا توجد رسائل في البريد الوارد';
    }

    // إحصائيات سريعة
    const totalEmails = this.mockEmails.length;
    const unreadCount = this.mockEmails.filter(e => !e.read).length;
    const importantCount = this.mockEmails.filter(e => e.important).length;

    const emailList = emails.map((email, index) => {
      const status = email.read ? '✅' : '🆕';
      const importance = email.important ? '⭐' : '📧';
      const dateStr = email.date.toLocaleDateString('ar-SA');
      return `${index + 1}. ${status} ${importance} ${email.subject}
   👤 ${email.from} | 📅 ${dateStr}`;
    }).join('\n\n');

    return `📬 قائمة الرسائل (${emails.length}/${totalEmails}):

${emailList}

📊 الإحصائيات:
• 🆕 غير مقروءة: ${unreadCount}
• ⭐ مهمة: ${importantCount}
• 📧 المجموع: ${totalEmails}

💡 استخدم "اقرأ رسالة #رقم" لقراءة رسالة محددة`;
  }

  async deleteEmail(emailId, params, context) {
    if (!emailId || isNaN(emailId)) {
      return 'يرجى تحديد رقم الرسالة المراد حذفها';
    }

    const emailIndex = this.mockEmails.findIndex(e => e.id == emailId);
    if (emailIndex === -1) {
      return `لم يتم العثور على رسالة برقم ${emailId}`;
    }

    const deletedEmail = this.mockEmails[emailIndex];
    
    // محاكاة عملية الحذف
    await this.simulateEmailOperation('delete');
    
    // حذف الرسالة
    this.mockEmails.splice(emailIndex, 1);

    return `🗑️ تم حذف الرسالة بنجاح!
📋 الرسالة المحذوفة:
• الرقم: #${deletedEmail.id}
• من: ${deletedEmail.from}
• الموضوع: ${deletedEmail.subject}
• التاريخ: ${deletedEmail.date.toLocaleString('ar-SA')}

⚠️ تم نقل الرسالة إلى سلة المهملات`;
  }

  async composeEmail(recipient, params, context) {
    // استخدام AI لمساعدة في كتابة الرسالة
    const { subject, tone = 'formal', language = 'arabic' } = params || {};
    
    const prompt = `Help compose an email:
- Recipient: ${recipient}
- Subject: ${subject || 'مرحباً'}
- Tone: ${tone}
- Language: ${language}

Write a polite ${tone} email in ${language}. Keep it concise and appropriate.`;

    try {
      const response = await context.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 200
      });

      const cost = context.costTracker.calculateOpenAICost(response);
      context.costTracker.addCost(cost);

      const composedEmail = response.choices[0].message.content.trim();
      const recipientEmail = this.resolveRecipient(recipient);

      return `✍️ تم إنشاء مسودة رسالة:

👤 إلى: ${recipientEmail}
📝 الموضوع: ${subject || 'مرحباً'}
🎨 الأسلوب: ${tone}

💬 المحتوى المقترح:
${composedEmail}

💡 يمكنك قول "أرسل هذه الرسالة" للإرسال
💡 أو "عدل الرسالة" لإجراء تغييرات`;

    } catch (error) {
      // Fallback رسالة بسيطة
      const recipientEmail = this.resolveRecipient(recipient);
      return `✍️ مسودة رسالة جديدة:

👤 إلى: ${recipientEmail}
📝 الموضوع: ${subject || 'مرحباً'}

💬 محتوى مقترح:
مرحباً،

أتمنى أن تكون بخير.

${this.userSettings.signature}

💡 يمكنك تخصيص المحتوى وإرسال الرسالة`;
    }
  }

  async getEmailSummary(context) {
    const totalEmails = this.mockEmails.length;
    const unreadEmails = this.mockEmails.filter(e => !e.read);
    const importantEmails = this.mockEmails.filter(e => e.important);
    const todayEmails = this.mockEmails.filter(e => {
      const today = new Date();
      const emailDate = new Date(e.date);
      return emailDate.toDateString() === today.toDateString();
    });

    // آخر رسالة
    const latestEmail = this.mockEmails
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

    return `📬 ملخص البريد الإلكتروني:

📊 الإحصائيات:
• 📧 إجمالي الرسائل: ${totalEmails}
• 🆕 غير مقروءة: ${unreadEmails.length}
• ⭐ مهمة: ${importantEmails.length}
• 📅 اليوم: ${todayEmails.length}

${latestEmail ? `📨 آخر رسالة:
• من: ${latestEmail.from}
• الموضوع: ${latestEmail.subject}
• التاريخ: ${latestEmail.date.toLocaleString('ar-SA')}
• الحالة: ${latestEmail.read ? 'مقروءة ✅' : 'جديدة 🆕'}` : ''}

💡 الأوامر المتاحة:
• "اقرأ الرسائل" - عرض آخر الرسائل
• "رسالة جديدة لأحمد" - إرسال رسالة
• "ابحث في الرسائل عن..." - البحث
• "احذف رسالة #رقم" - حذف رسالة`;
  }

  // Helper methods
  resolveRecipient(recipient) {
    if (!recipient) return 'unknown@example.com';
    
    // البحث في جهات الاتصال
    const contactEmail = this.contacts[recipient.toLowerCase()];
    if (contactEmail) return contactEmail;
    
    // التحقق من صيغة البريد الإلكتروني
    if (recipient.includes('@')) return recipient;
    
    // افتراضي
    return `${recipient.toLowerCase()}@example.com`;
  }

  async simulateEmailSending() {
    // محاكاة وقت الإرسال
    const delay = Math.random() * 1000 + 500; // 0.5-1.5 ثانية
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  async simulateEmailOperation(operation) {
    // محاكاة عمليات البريد المختلفة
    const delays = {
      'send': 1000,
      'read': 200,
      'delete': 300,
      'search': 400
    };
    
    const delay = delays[operation] || 500;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  calculateMatch(intent) {
    if (intent.domain !== 'email') return 0;
    
    // تحسين مطابقة النية للبريد الإلكتروني
    const actionMatch = this.capabilities.includes(intent.action) ? 0.4 : 0;
    const confidenceBonus = (intent.confidence || 0.5) * 0.6;
    
    // إضافة نقاط للكلمات المفتاحية
    const emailKeywords = ['email', 'mail', 'رسالة', 'بريد', 'أرسل', 'send'];
    const hasEmailKeywords = emailKeywords.some(keyword => 
      JSON.stringify(intent.entities).toLowerCase().includes(keyword)
    );
    
    const keywordBonus = hasEmailKeywords ? 0.2 : 0;
    
    return Math.min(1.0, actionMatch + confidenceBonus + keywordBonus);
  }

  // Configuration method
  configure(config) {
    super.configure(config);
    
    if (config.userEmail) {
      this.userSettings.email = config.userEmail;
    }
    
    if (config.userName) {
      this.userSettings.name = config.userName;
    }
    
    if (config.signature) {
      this.userSettings.signature = config.signature;
    }
    
    if (config.contacts) {
      this.contacts = { ...this.contacts, ...config.contacts };
    }
  }

  // إضافة جهة اتصال جديدة
  addContact(name, email) {
    this.contacts[name.toLowerCase()] = email;
    return `تم إضافة ${name} (${email}) إلى جهات الاتصال`;
  }

  // إحصائيات مفصلة
  getDetailedStats() {
    const stats = {
      totalEmails: this.mockEmails.length,
      unreadCount: this.mockEmails.filter(e => !e.read).length,
      importantCount: this.mockEmails.filter(e => e.important).length,
      sentCount: this.mockEmails.filter(e => e.from === this.userSettings.email).length,
      contactsCount: Object.keys(this.contacts).length
    };
    
    return `📊 إحصائيات البريد الإلكتروني المفصلة:
• 📧 إجمالي الرسائل: ${stats.totalEmails}
• 🆕 غير مقروءة: ${stats.unreadCount}
• ⭐ مهمة: ${stats.importantCount}
• 📤 مرسلة: ${stats.sentCount}
• 👥 جهات الاتصال: ${stats.contactsCount}`;
  }
}