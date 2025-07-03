const emailPlugin = {
  name: "email",
  version: "1.0.0",
  description: "إرسال واستقبال الإيميلات",
  author: "NiaScript Team",
  
  triggers: [
    /send email|ارسل ايميل|ارسل لبريد/i,
    /email to|بريد الى|إيميل إلى/i,
    /إرسال رسالة|أرسل رسالة/i,
    /mail to|رسالة إلى/i
  ],
  
  providers: {
    smtp: {
      type: "custom",
      config: {
        host: "${SMTP_HOST}",
        port: "${SMTP_PORT}",
        secure: false,
        auth: {
          user: "${SMTP_USER}",
          pass: "${SMTP_PASS}"
        }
      }
    },
    
    gmail_api: {
      baseURL: "https://gmail.googleapis.com/gmail/v1",
      auth: {
        type: "oauth2",
        client_id: "${GMAIL_CLIENT_ID}",
        client_secret: "${GMAIL_CLIENT_SECRET}",
        refresh_token: "${GMAIL_REFRESH_TOKEN}"
      },
      endpoints: {
        send: "/users/me/messages/send",
        list: "/users/me/messages",
        get: "/users/me/messages/${messageId}"
      },
      rateLimits: {
        requests: 250,
        window: 60000
      },
      cost: 0,
      reliability: 0.98
    },
    
    sendgrid: {
      baseURL: "https://api.sendgrid.com/v3",
      auth: {
        type: "apikey",
        key: "${SENDGRID_API_KEY}"
      },
      endpoints: {
        send: "/mail/send"
      },
      rateLimits: {
        requests: 600,
        window: 60000
      },
      cost: 0.001,
      reliability: 0.95
    }
  },
  
  recipes: {
    send_email: {
      confidence: 0.90,
      steps: [
        {
          action: "extract_email_parts",
          query: "${query}",
          assign_to: "email_parts"
        },
        {
          action: "validate_email_address",
          email: "${email_parts.recipient}",
          assign_to: "is_valid_email"
        },
        {
          action: "conditional",
          condition: "${is_valid_email}",
          if_true: [
            {
              action: "send_smtp_email",
              provider: "smtp",
              params: {
                to: "${email_parts.recipient}",
                subject: "${email_parts.subject}",
                text: "${email_parts.content}",
                html: "${email_parts.html_content}"
              },
              assign_to: "send_result"
            },
            {
              action: "format_response",
              template: "✅ تم إرسال الإيميل إلى ${email_parts.recipient}",
              return: true
            }
          ],
          if_false: [
            {
              action: "format_response",
              template: "❌ عنوان البريد الإلكتروني غير صحيح: ${email_parts.recipient}",
              return: true
            }
          ]
        }
      ],
      fallbacks: [
        {
          provider: "sendgrid",
          confidence: 0.85,
          steps: [
            {
              action: "send_via_sendgrid",
              email_parts: "${email_parts}",
              assign_to: "sendgrid_result"
            },
            {
              action: "format_response",
              template: "✅ تم إرسال الإيميل عبر SendGrid إلى ${email_parts.recipient}",
              return: true
            }
          ]
        }
      ]
    },
    
    check_email: {
      confidence: 0.85,
      steps: [
        {
          action: "fetch_recent_emails",
          provider: "gmail_api",
          limit: 10,
          assign_to: "recent_emails"
        },
        {
          action: "format_email_list",
          emails: "${recent_emails}",
          assign_to: "formatted_list"
        },
        {
          action: "format_response",
          template: "آخر الإيميلات:\n${formatted_list}",
          return: true
        }
      ]
    },
    
    compose_email: {
      confidence: 0.80,
      steps: [
        {
          action: "generate_email_content",
          subject: "${subject}",
          recipient: "${recipient}",
          content: "${content}",
          assign_to: "composed_email"
        },
        {
          action: "format_response",
          template: "تم تجهيز الإيميل:\nإلى: ${composed_email.to}\nالموضوع: ${composed_email.subject}\nالمحتوى: ${composed_email.body}",
          return: true
        }
      ]
    }
  },
  
  customActions: {
    extract_email_parts: async (params) => {
      const query = params.query;
      let recipient = "";
      let subject = "رسالة من NiaScript";
      let content = "";
      
      // استخراج المتلقي
      const recipientPatterns = [
        /(?:لبريدي?|to|email)\s+(\S+@\S+\.\S+)/i,
        /(?:لبريدي?|to|email)\s+(\w+)/i,
        /(?:إلى|to)\s+(\S+@\S+\.\S+)/i,
        /(?:إلى|to)\s+(\w+)/i
      ];
      
      for (const pattern of recipientPatterns) {
        const match = query.match(pattern);
        if (match) {
          recipient = match[1];
          // إذا لم يكن إيميل كامل، نضيف النطاق الافتراضي
          if (!recipient.includes('@')) {
            recipient += '@example.com';
          }
          break;
        }
      }
      
      // استخراج الموضوع
      const subjectPatterns = [
        /(?:موضوع|subject)[:\s]+(.*?)(?:\n|$)/i,
        /(?:عنوان|title)[:\s]+(.*?)(?:\n|$)/i
      ];
      
      for (const pattern of subjectPatterns) {
        const match = query.match(pattern);
        if (match) {
          subject = match[1].trim();
          break;
        }
      }
      
      // استخراج المحتوى
      const contentPatterns = [
        /(?:النص|المحتوى|content|message)[:\s]+(.*?)$/i,
        /(?:الرسالة|text)[:\s]+(.*?)$/i,
        /"([^"]+)"/,
        /'([^']+)'/
      ];
      
      for (const pattern of contentPatterns) {
        const match = query.match(pattern);
        if (match) {
          content = match[1].trim();
          break;
        }
      }
      
      // إذا لم نجد محتوى محدد، نأخذ الجزء الأخير من الاستعلام
      if (!content) {
        const parts = query.split(/(?:لبريدي?|to|email)\s+\S+/i);
        if (parts[1]) {
          content = parts[1].trim();
        }
      }
      
      return {
        recipient,
        subject,
        content,
        html_content: `<p>${content}</p>`
      };
    },
    
    validate_email_address: async (params) => {
      const email = params.email;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    },
    
    send_smtp_email: async (params) => {
      const { to, subject, text, html } = params;
      
      // محاكاة إرسال SMTP
      console.log(`إرسال إيميل SMTP إلى: ${to}`);
      console.log(`الموضوع: ${subject}`);
      console.log(`المحتوى: ${text}`);
      
      // في التطبيق الحقيقي، سنستخدم nodemailer أو مكتبة SMTP أخرى
      /*
      const nodemailer = require('nodemailer');
      
      const transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
      
      const mailOptions = {
        from: process.env.SMTP_USER,
        to: to,
        subject: subject,
        text: text,
        html: html
      };
      
      const result = await transporter.sendMail(mailOptions);
      return result;
      */
      
      return {
        success: true,
        messageId: `msg_${Date.now()}`,
        recipient: to,
        timestamp: new Date().toISOString()
      };
    },
    
    send_via_sendgrid: async (params) => {
      const { email_parts } = params;
      
      console.log(`إرسال إيميل عبر SendGrid إلى: ${email_parts.recipient}`);
      
      // في التطبيق الحقيقي، سنستخدم SendGrid API
      /*
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      
      const msg = {
        to: email_parts.recipient,
        from: process.env.FROM_EMAIL,
        subject: email_parts.subject,
        text: email_parts.content,
        html: email_parts.html_content,
      };
      
      const result = await sgMail.send(msg);
      return result;
      */
      
      return {
        success: true,
        messageId: `sg_${Date.now()}`,
        recipient: email_parts.recipient
      };
    },
    
    fetch_recent_emails: async (params) => {
      const { limit = 10 } = params;
      
      console.log(`جلب آخر ${limit} إيميلات`);
      
      // محاكاة جلب الإيميلات
      const mockEmails = [
        {
          id: "email1",
          from: "sender1@example.com",
          subject: "مرحبا",
          snippet: "هذه رسالة تجريبية...",
          date: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: "email2", 
          from: "sender2@example.com",
          subject: "اجتماع اليوم",
          snippet: "تذكير بالاجتماع في الساعة...",
          date: new Date(Date.now() - 7200000).toISOString()
        }
      ];
      
      return mockEmails.slice(0, limit);
    },
    
    format_email_list: async (params) => {
      const emails = params.emails;
      
      return emails.map((email, index) => {
        const date = new Date(email.date).toLocaleString('ar-SA');
        return `${index + 1}. من: ${email.from}\n   الموضوع: ${email.subject}\n   التاريخ: ${date}\n   المقطع: ${email.snippet}`;
      }).join('\n\n');
    },
    
    generate_email_content: async (params) => {
      const { subject, recipient, content } = params;
      
      // تحسين المحتوى وإضافة تحية وخاتمة مناسبة
      let improvedContent = content;
      
      // إضافة تحية إذا لم تكن موجودة
      if (!content.includes('مرحبا') && !content.includes('السلام') && !content.includes('Hi') && !content.includes('Hello')) {
        if (/[\u0600-\u06FF]/.test(content)) {
          improvedContent = `مرحباً،\n\n${content}`;
        } else {
          improvedContent = `Hello,\n\n${content}`;
        }
      }
      
      // إضافة خاتمة إذا لم تكن موجودة
      if (!content.includes('شكراً') && !content.includes('مع التحية') && !content.includes('Best regards') && !content.includes('Thank you')) {
        if (/[\u0600-\u06FF]/.test(content)) {
          improvedContent += `\n\nمع أطيب التحيات،\nNiaScript`;
        } else {
          improvedContent += `\n\nBest regards,\nNiaScript`;
        }
      }
      
      return {
        to: recipient,
        subject: subject || "رسالة من NiaScript",
        body: improvedContent,
        html: `<p>${improvedContent.replace(/\n/g, '<br>')}</p>`
      };
    },
    
    parse_email_query: async (params) => {
      const query = params.query;
      
      // تحليل أكثر تفصيلاً للاستعلام
      const analysis = {
        intent: "send", // send, check, compose, reply
        recipient: null,
        subject: null,
        content: null,
        urgency: "normal", // low, normal, high
        attachments: []
      };
      
      // تحديد النية
      if (/check|اقرأ|اعرض|فحص/.test(query)) {
        analysis.intent = "check";
      } else if (/compose|اكتب|أنشئ/.test(query)) {
        analysis.intent = "compose";
      } else if (/reply|رد|جاوب/.test(query)) {
        analysis.intent = "reply";
      }
      
      // تحديد الأولوية
      if (/urgent|عاجل|مهم|فوري/.test(query)) {
        analysis.urgency = "high";
      } else if (/later|لاحقاً|ليس عاجل/.test(query)) {
        analysis.urgency = "low";
      }
      
      return analysis;
    },
    
    get_email_templates: async (params) => {
      const type = params.type || "general";
      
      const templates = {
        business: {
          ar: {
            subject: "بخصوص ${topic}",
            body: "السلام عليكم،\n\nأتواصل معكم بخصوص ${topic}.\n\n${content}\n\nأرجو منكم التكرم بالرد في أقرب وقت ممكن.\n\nشكراً لكم،\n${sender}"
          },
          en: {
            subject: "Regarding ${topic}",
            body: "Dear ${recipient},\n\nI am writing to you regarding ${topic}.\n\n${content}\n\nI would appreciate your prompt response.\n\nBest regards,\n${sender}"
          }
        },
        casual: {
          ar: {
            subject: "${topic}",
            body: "مرحباً،\n\n${content}\n\nأتطلع لسماع ردك!\n\n${sender}"
          },
          en: {
            subject: "${topic}",
            body: "Hi there,\n\n${content}\n\nLooking forward to hearing from you!\n\n${sender}"
          }
        },
        meeting: {
          ar: {
            subject: "دعوة لاجتماع - ${topic}",
            body: "السلام عليكم،\n\nأرغب في دعوتكم لحضور اجتماع حول ${topic}.\n\nالتاريخ: ${date}\nالوقت: ${time}\nالمكان: ${location}\n\n${content}\n\nأرجو تأكيد الحضور.\n\nشكراً،\n${sender}"
          },
          en: {
            subject: "Meeting Invitation - ${topic}",
            body: "Dear ${recipient},\n\nI would like to invite you to a meeting about ${topic}.\n\nDate: ${date}\nTime: ${time}\nLocation: ${location}\n\n${content}\n\nPlease confirm your attendance.\n\nBest regards,\n${sender}"
          }
        }
      };
      
      return templates[type] || templates.general;
    }
  }
};

export default emailPlugin;