import { createContext, useContext, useEffect, useRef, useState } from "react";

const LanguageContext = createContext({ language: "en", setLanguage: () => {} });

const ru = {
  "How it works": "Как это работает",
  Services: "Услуги",
  Trust: "Почему мы",
  "Request a task": "Оставить заявку",
  "LOCAL HELP IN GEORGIA": "ПОМОЩЬ НА МЕСТЕ В ГРУЗИИ",
  "Need something": "Нужно что-то",
  "done in": "сделать в",
  "Georgia?": "Грузии?",
  "You're not here.": "Вы не здесь.",
  "We are.": "А мы — здесь.",
  "LocalGeo gives you trusted local hands when you need something checked, collected, delivered or handled in Georgia.": "LocalGeo помогает, когда в Грузии нужно что-то проверить, забрать, доставить или решить на месте.",
  "Local assistance": "Помощь на месте",
  "Photo & video proof": "Фото- и видеоподтверждение",
  "Clear communication": "Понятная коммуникация",
  Georgia: "Грузия",
  "YOUR LOCAL HANDS": "ВАШИ ЛЮДИ НА МЕСТЕ",
  "Local execution": "Выполнение на месте",
  "Real people": "Реальные люди",
  "01 / HOW IT WORKS": "01 / КАК ЭТО РАБОТАЕТ",
  "You ask.": "Вы обращаетесь.",
  "We": "Мы",
  "handle it.": "решаем задачу.",
  "No need to find a stranger, explain everything twice or arrange five different services. Tell us what needs to happen.": "Не нужно искать незнакомых людей, объяснять всё дважды или координировать несколько сервисов. Просто расскажите, что нужно сделать.",
  "Tell us": "Расскажите нам",
  "Describe what you need and where it needs to happen.": "Опишите, что нужно сделать и где.",
  "We handle it": "Мы организуем",
  "We assign a local person and coordinate the task.": "Мы назначаем местного исполнителя и координируем задачу.",
  "You get proof": "Вы получаете подтверждение",
  "Photos, video, receipts and a clear summary of what happened.": "Фото, видео, чеки и понятный отчёт о результате.",
  "02 / SERVICES": "02 / УСЛУГИ",
  "Whatever needs": "Всё, что нужно",
  "doing.": "сделать.",
  "Start with a simple request. If your task doesn't fit a category, just tell us what happened.": "Начните с простой заявки. Если задача не подходит под категорию — просто опишите её.",
  Check: "Проверить",
  "We visit, inspect and document things when you can't be there.": "Мы приезжаем, проверяем и фиксируем детали, когда вы не можете быть на месте.",
  "Request this": "Выбрать услугу",
  Home: "Дом и жильё",
  "Apartment checks, repairs, technicians, deliveries and local errands.": "Проверка квартиры, ремонт, встреча мастеров, доставки и местные поручения.",
  "Pick up": "Забрать",
  "Documents, keys, packages, purchases and other items.": "Документы, ключи, посылки, покупки и другие вещи.",
  Deliver: "Доставить",
  "We move things from one place to another safely and locally.": "Мы безопасно доставляем вещи по месту.",
  "Something else": "Другая задача",
  "Have a problem in Georgia? Tell us what you need.": "Есть задача в Грузии? Расскажите, что нужно.",
  "03 / THE LOCALGEO PROMISE": "03 / ОБЕЩАНИЕ LOCALGEO",
  "You don't need": "Вам больше не нужен",
  "a friend in Georgia": "друг в Грузии",
  "anymore.": "",
  "Distance shouldn't make simple things difficult.": "Расстояние не должно усложнять простые задачи.",
  Evidence: "Подтверждение",
  "Someone physically goes where the task needs to happen.": "Исполнитель лично приезжает туда, где нужно выполнить задачу.",
  "When appropriate, you receive photos, video and receipts.": "Когда это уместно, вы получаете фото, видео и чеки.",
  "No disappearing acts. We keep you informed about the task.": "Мы не пропадаем и держим вас в курсе хода работы.",
  "04 / WHEN LOCALGEO HELPS": "04 / КОГДА ПОМОГАЕТ LOCALGEO",
  "Real problems.": "Реальные задачи.",
  "Local answers.": "Решения на месте.",
  "Use LocalGeo when distance is the problem — not the task itself.": "LocalGeo помогает, когда проблема — расстояние, а не сама задача.",
  "Your apartment is empty": "Ваша квартира пустует",
  "We can check a property, meet a technician, collect keys and document what we find.": "Мы можем проверить жильё, встретить мастера, забрать ключи и зафиксировать результат.",
  "You need proof before deciding": "Нужно подтверждение перед решением",
  "We can visit a location, inspect an item and send photos, video or a clear written update.": "Мы можем посетить место, проверить объект и отправить фото, видео или понятный отчёт.",
  "You need someone there": "Нужен человек на месте",
  "We can pick up documents, make a delivery or handle a practical local errand on your behalf.": "Мы можем забрать документы, выполнить доставку или другое практическое поручение от вашего имени.",
  "04 / REQUEST": "05 / ЗАЯВКА",
  "Tell us what": "Расскажите, что",
  "you": "вам",
  "need.": "нужно.",
  "Don't worry if you're not sure which service fits. Describe the situation in your own words and we'll take it from there.": "Не переживайте, если не знаете, какая услуга подходит. Опишите ситуацию своими словами — дальше мы разберёмся.",
  "This is an initial request. We'll review the task and confirm availability and pricing before anything is scheduled.": "Это предварительная заявка. Мы проверим возможность выполнения и согласуем цену до начала работы.",
  "REQUEST RECEIVED": "ЗАЯВКА ПОЛУЧЕНА",
  "Thank you.": "Спасибо.",
  "We've received your request and will review it before confirming availability and pricing.": "Мы получили заявку и проверим возможность выполнения и стоимость.",
  "REQUEST ID": "НОМЕР ЗАЯВКИ",
  "PRIVATE TRACKING LINK": "ЛИЧНАЯ ССЫЛКА ДЛЯ ОТСЛЕЖИВАНИЯ",
  "Save this link to follow the progress of your request.": "Сохраните ссылку, чтобы отслеживать ход заявки.",
  "Track this request": "Отслеживать заявку",
  "Submit another request": "Отправить ещё одну заявку",
  "What do you need?": "Что вам нужно?",
  "Check something": "Что-то проверить",
  "Pick something up": "Что-то забрать",
  "Deliver something": "Что-то доставить",
  "Home visit": "Выезд к жилью",
  Other: "Другое",
  City: "Город",
  "Select city": "Выберите город",
  "When?": "Когда?",
  "As soon as possible": "Как можно скорее",
  Today: "Сегодня",
  Tomorrow: "Завтра",
  "Within a few days": "В течение нескольких дней",
  "I have a specific date": "У меня есть конкретная дата",
  "Address / location": "Адрес / место",
  "Street, building, landmark...": "Улица, дом, ориентир...",
  "Tell us what you need": "Опишите задачу",
  "Describe the situation in your own words...": "Опишите ситуацию своими словами...",
  "Your name": "Ваше имя",
  Email: "Электронная почта",
  "Please select what you need.": "Пожалуйста, выберите услугу.",
  "Please select a city.": "Пожалуйста, выберите город.",
  "Please enter the address or location.": "Пожалуйста, укажите адрес или место.",
  "Please describe what you need.": "Пожалуйста, опишите задачу.",
  "Please enter your name.": "Пожалуйста, укажите имя.",
  "Please enter your email.": "Пожалуйста, укажите электронную почту.",
  "Please complete the security verification.": "Пожалуйста, пройдите проверку безопасности.",
  "We couldn't send your request. Please try again.": "Не удалось отправить заявку. Попробуйте ещё раз.",
  Sending: "Отправка...",
  "No payment is required at this stage. We'll review your request first.": "На этом этапе оплата не требуется. Сначала мы рассмотрим заявку.",
  "Your trusted local hands in Georgia.": "Ваши надёжные помощники на месте в Грузии.",
  "Back to top": "Наверх",
  Privacy: "Конфиденциальность",
  Terms: "Условия",
  "Security verification helps protect this form from spam.": "Проверка безопасности защищает форму от спама.",
  "REQUEST TRACKING": "ОТСЛЕЖИВАНИЕ ЗАЯВКИ",
  "Loading your request…": "Загрузка заявки…",
  "We couldn't find this request.": "Мы не смогли найти эту заявку.",
  "Back to LocalGeo": "Вернуться в LocalGeo",
  "Your request": "Ваша заявка",
  Service: "Услуга",
  "Requested for": "Срок выполнения",
  Progress: "Ход выполнения",
  "Completion evidence shared": "Подтверждение выполнения добавлено",
  "Request received": "Заявка получена",
  "We contacted you": "Мы связались с вами",
  "Task assigned": "Исполнитель назначен",
  "Task in progress": "Задача выполняется",
  "Task completed": "Задача выполнена",
  "Request cancelled": "Заявка отменена",
  "This tracking link is invalid or the request is unavailable.": "Эта ссылка для отслеживания недействительна или заявка недоступна.",
  "Open proof": "Открыть подтверждение",
  "No updates yet.": "Пока нет обновлений.",
  "This private link shows the status of this request only. Keep it safe.": "Эта личная ссылка показывает статус только этой заявки. Сохраните её в безопасности.",
  "Privacy Policy": "Политика конфиденциальности",
  "Terms of Service": "Условия использования",
  "Last updated: 13 August 2026": "Последнее обновление: 13 августа 2026",
  "LEGAL / PRIVACY": "ЮРИДИЧЕСКАЯ ИНФОРМАЦИЯ / КОНФИДЕНЦИАЛЬНОСТЬ",
  "LEGAL / TERMS": "ЮРИДИЧЕСКАЯ ИНФОРМАЦИЯ / УСЛОВИЯ",
  "Draft information page — replace the marked business details and obtain local legal review before relying on it as a final policy.": "Это черновик информационной страницы. Замените отмеченные реквизиты компании и получите местную юридическую проверку перед использованием как окончательной политики.",
  "Back to LocalGeo": "Вернуться в LocalGeo",
  "What we collect": "Какие данные мы собираем",
  "When you send a request, we collect the contact details and task information you provide, including your name, email address, phone or messenger contact, city, address and request description.": "Когда вы отправляете заявку, мы собираем указанные вами контактные данные и сведения о задаче: имя, электронную почту, телефон или контакт в мессенджере, город, адрес и описание заявки.",
  "Why we use it": "Как мы используем данные",
  "We use this information to review and fulfil your request, communicate with you, assign a local executor, provide proof of completion and maintain our business records.": "Мы используем эти сведения для рассмотрения и выполнения заявки, связи с вами, назначения местного исполнителя, предоставления подтверждения выполнения и ведения деловой документации.",
  "Who can access it": "Кто имеет доступ",
  "Access is limited to LocalGeo personnel and the local executor only when the information is necessary to complete the task. We do not sell personal data.": "Доступ имеют только сотрудники LocalGeo и местный исполнитель — лишь когда информация необходима для выполнения задачи. Мы не продаём персональные данные.",
  "Retention and security": "Хранение и безопасность",
  "We keep request records only for as long as reasonably needed for operations, support, accounting and legal obligations. We use reasonable technical and organisational safeguards, but no online system can guarantee absolute security.": "Мы храним записи заявок только столько, сколько это разумно необходимо для работы, поддержки, бухгалтерского учёта и юридических обязанностей. Мы используем разумные технические и организационные меры защиты, но ни одна онлайн-система не может гарантировать абсолютную безопасность.",
  "Your choices": "Ваши права",
  "You may request access, correction or deletion of your personal data, subject to any legal or operational retention requirements, by contacting LocalGeo.": "Связавшись с LocalGeo, вы можете запросить доступ, исправление или удаление персональных данных с учётом требований законодательства и операционного хранения.",
  Contact: "Контакты",
  "Before publishing this policy, replace this sentence with your legal business name, business address and support email address.": "Перед публикацией политики замените это предложение юридическим названием компании, адресом и электронной почтой поддержки.",
  "LocalGeo helps coordinate local task execution in Georgia. A submitted request is not automatically accepted. We confirm scope, availability and pricing before work is scheduled.": "LocalGeo помогает координировать выполнение задач на месте в Грузии. Отправленная заявка не принимается автоматически. Перед началом работы мы подтверждаем объём, возможность выполнения и стоимость.",
  "Customer responsibilities": "Обязанности клиента",
  "You must provide accurate information, have the authority to request the task and respond to reasonable clarification requests. You must not request unlawful, unsafe or misleading activity.": "Вы должны предоставить точную информацию, иметь полномочия на заказ задачи и отвечать на обоснованные уточняющие вопросы. Нельзя заказывать незаконные, небезопасные или вводящие в заблуждение действия.",
  "Pricing and payment": "Цена и оплата",
  "Any quoted price is confirmed for the agreed scope. Additional work, expenses or changes may require a revised confirmation. Payment terms are communicated before completion where applicable.": "Любая названная цена подтверждается для согласованного объёма работ. Дополнительная работа, расходы или изменения могут потребовать нового подтверждения. Условия оплаты сообщаются до завершения работы, когда это применимо.",
  "Proof and completion": "Подтверждение и завершение",
  "Where appropriate, LocalGeo may provide photos, videos, receipts or a written update. Proof is limited to what is lawful, safe and practical at the task location.": "Когда это уместно, LocalGeo может предоставить фото, видео, чеки или письменный отчёт. Подтверждение ограничивается тем, что законно, безопасно и практически возможно на месте выполнения.",
  Cancellations: "Отмена",
  "If a task is cancelled after local work, travel or purchases have begun, reasonable completed-work and non-refundable expense charges may apply.": "Если задача отменена после начала местной работы, поездки или покупок, могут применяться разумные расходы за выполненную работу и невозвратные траты.",
  Limits: "Ограничения",
  "LocalGeo does not guarantee third-party actions, availability of goods or outcomes outside the agreed task scope. Before publishing these terms, replace this sentence with your legal business name, governing law and support email address.": "LocalGeo не гарантирует действия третьих лиц, наличие товаров или результаты за пределами согласованного объёма задачи. Перед публикацией условий замените это предложение юридическим названием компании, применимым правом и электронной почтой поддержки."
};

const ka = {
  "How it works": "როგორ მუშაობს", Services: "სერვისები", Trust: "ნდობა", "Request a task": "მოთხოვნის გაგზავნა",
  "LOCAL HELP IN GEORGIA": "ადგილობრივი დახმარება საქართველოში", "Need something": "გჭირდებათ რაღაცის", "done in": "გაკეთება",
  "Georgia?": "საქართველოში?", "You're not here.": "თქვენ აქ არ ხართ.", "We are.": "ჩვენ კი — აქ ვართ.",
  "LocalGeo gives you trusted local hands when you need something checked, collected, delivered or handled in Georgia.": "LocalGeo გაძლევთ სანდო ადგილობრივ დახმარებას, როცა საქართველოში რაიმეს შემოწმება, აღება, მიწოდება ან მოგვარება გჭირდებათ.",
  "Local assistance": "ადგილობრივი დახმარება", "Photo & video proof": "ფოტო და ვიდეო მტკიცებულება", "Clear communication": "მკაფიო კომუნიკაცია",
  Georgia: "საქართველო", "YOUR LOCAL HANDS": "თქვენი ადგილობრივი დამხმარეები", "Local execution": "შესრულება ადგილზე", "Real people": "რეალური ადამიანები",
  "01 / HOW IT WORKS": "01 / როგორ მუშაობს", "You ask.": "თქვენ ითხოვთ.", We: "ჩვენ", "handle it.": "ვაგვარებთ.",
  "No need to find a stranger, explain everything twice or arrange five different services. Tell us what needs to happen.": "არ არის საჭირო უცნობის ძებნა, ყველაფრის ორჯერ ახსნა ან ხუთი სხვადასხვა სერვისის ორგანიზება. უბრალოდ გვითხარით, რა უნდა მოხდეს.",
  "Tell us": "გვითხარით", "Describe what you need and where it needs to happen.": "აღწერეთ, რა გჭირდებათ და სად უნდა შესრულდეს.",
  "We handle it": "ჩვენ ვაგვარებთ", "We assign a local person and coordinate the task.": "ჩვენ ვნიშნავთ ადგილობრივ შემსრულებელს და ვაკოორდინირებთ დავალებას.",
  "You get proof": "თქვენ იღებთ მტკიცებულებას", "Photos, video, receipts and a clear summary of what happened.": "ფოტოები, ვიდეო, ქვითრები და მკაფიო ანგარიში მომხდარის შესახებ.",
  "02 / SERVICES": "02 / სერვისები", "Whatever needs": "რაც არ უნდა", "doing.": "დაგჭირდეთ",
  "Start with a simple request. If your task doesn't fit a category, just tell us what happened.": "დაიწყეთ მარტივი მოთხოვნით. თუ თქვენი საქმე კატეგორიას არ შეესაბამება, უბრალოდ აგვიწერეთ.",
  Check: "შემოწმება", "We visit, inspect and document things when you can't be there.": "ჩვენ მივდივართ, ვამოწმებთ და ვაფიქსირებთ დეტალებს, როცა თქვენ იქ ვერ ხართ.",
  "Request this": "სერვისის არჩევა", Home: "სახლი", "Apartment checks, repairs, technicians, deliveries and local errands.": "ბინის შემოწმება, შეკეთება, ტექნიკოსები, მიწოდება და ადგილობრივი დავალებები.",
  "Pick up": "აღება", "Documents, keys, packages, purchases and other items.": "დოკუმენტები, გასაღებები, ამანათები, შესყიდვები და სხვა ნივთები.",
  Deliver: "მიწოდება", "We move things from one place to another safely and locally.": "ჩვენ ნივთებს უსაფრთხოდ ვგზავნით ერთი ადგილიდან მეორეზე.",
  "Something else": "სხვა დავალება", "Have a problem in Georgia? Tell us what you need.": "გაქვთ საქმე საქართველოში? გვითხარით, რა გჭირდებათ.",
  "03 / THE LOCALGEO PROMISE": "03 / LOCALGEO-ს დაპირება", "You don't need": "თქვენ აღარ გჭირდებათ", "a friend in Georgia": "მეგობარი საქართველოში", "anymore.": "",
  "Distance shouldn't make simple things difficult.": "მანძილმა მარტივი საქმეები არ უნდა გაართულოს.", Evidence: "მტკიცებულება",
  "Someone physically goes where the task needs to happen.": "ვიღაც პირადად მიდის იქ, სადაც დავალება უნდა შესრულდეს.",
  "When appropriate, you receive photos, video and receipts.": "როცა შესაძლებელია, იღებთ ფოტოებს, ვიდეოსა და ქვითრებს.",
  "No disappearing acts. We keep you informed about the task.": "არ ვიკარგებით — მუდმივად გაცნობებთ დავალების მიმდინარეობას.",
  "04 / WHEN LOCALGEO HELPS": "04 / როდის გეხმარებათ LOCALGEO", "Real problems.": "რეალური პრობლემები.", "Local answers.": "ადგილობრივი პასუხები.",
  "Use LocalGeo when distance is the problem — not the task itself.": "გამოიყენეთ LocalGeo, როცა პრობლემა მანძილია და არა თვითონ დავალება.",
  "Your apartment is empty": "თქვენი ბინა ცარიელია", "We can check a property, meet a technician, collect keys and document what we find.": "შეგვიძლია შევამოწმოთ ქონება, შევხვდეთ ტექნიკოსს, ავიღოთ გასაღებები და დავაფიქსიროთ შედეგი.",
  "You need proof before deciding": "გადაწყვეტამდე მტკიცებულება გჭირდებათ", "We can visit a location, inspect an item and send photos, video or a clear written update.": "შეგვიძლია მოვინახულოთ ადგილი, შევამოწმოთ ნივთი და გამოგიგზავნოთ ფოტო, ვიდეო ან წერილობითი ანგარიში.",
  "You need someone there": "იქ ადამიანი გჭირდებათ", "We can pick up documents, make a delivery or handle a practical local errand on your behalf.": "შეგვიძლია ავიღოთ დოკუმენტები, მივიტანოთ ნივთი ან თქვენი სახელით შევასრულოთ ადგილობრივი საქმე.",
  "04 / REQUEST": "05 / მოთხოვნა", "Tell us what": "გვითხარით, რა", you: "გჭირდებათ", "need.": "",
  "Don't worry if you're not sure which service fits. Describe the situation in your own words and we'll take it from there.": "თუ არ იცით რომელი სერვისი გერგებათ, არ ინერვიულოთ. აღწერეთ სიტუაცია თქვენი სიტყვებით და დანარჩენს ჩვენ მივხედავთ.",
  "This is an initial request. We'll review the task and confirm availability and pricing before anything is scheduled.": "ეს საწყისი მოთხოვნაა. დავალებას განვიხილავთ და სამუშაოს დაწყებამდე დავადასტურებთ ხელმისაწვდომობასა და ფასს.",
  "REQUEST RECEIVED": "მოთხოვნა მიღებულია", "Thank you.": "გმადლობთ.", "We've received your request and will review it before confirming availability and pricing.": "ჩვენ მივიღეთ თქვენი მოთხოვნა და განვიხილავთ მას ხელმისაწვდომობისა და ფასის დადასტურებამდე.",
  "REQUEST ID": "მოთხოვნის ნომერი", "PRIVATE TRACKING LINK": "პირადი ბმული თვალყურის დევნებისთვის", "Save this link to follow the progress of your request.": "შეინახეთ ბმული, რომ თვალი ადევნოთ თქვენი მოთხოვნის მიმდინარეობას.",
  "Track this request": "მოთხოვნის თვალყურის დევნება", "Submit another request": "კიდევ ერთი მოთხოვნის გაგზავნა",
  "What do you need?": "რა გჭირდებათ?", "Check something": "რაიმეს შემოწმება", "Pick something up": "რაიმეს აღება", "Deliver something": "რაიმეს მიწოდება", "Home visit": "სახლში ვიზიტი", Other: "სხვა",
  City: "ქალაქი", "Select city": "აირჩიეთ ქალაქი", "When?": "როდის?", "As soon as possible": "რაც შეიძლება მალე", Today: "დღეს", Tomorrow: "ხვალ", "Within a few days": "რამდენიმე დღეში", "I have a specific date": "კონკრეტული თარიღი მაქვს",
  "Address / location": "მისამართი / ადგილი", "Street, building, landmark...": "ქუჩა, შენობა, ორიენტირი...", "Tell us what you need": "აღწერეთ, რა გჭირდებათ", "Describe the situation in your own words...": "აღწერეთ სიტუაცია თქვენი სიტყვებით...", "Your name": "თქვენი სახელი", Email: "ელფოსტა",
  "Please select what you need.": "გთხოვთ, აირჩიეთ სერვისი.", "Please select a city.": "გთხოვთ, აირჩიეთ ქალაქი.", "Please enter the address or location.": "გთხოვთ, მიუთითეთ მისამართი ან ადგილი.", "Please describe what you need.": "გთხოვთ, აღწერეთ დავალება.", "Please enter your name.": "გთხოვთ, მიუთითეთ თქვენი სახელი.", "Please enter your email.": "გთხოვთ, მიუთითეთ ელფოსტა.", "Please complete the security verification.": "გთხოვთ, გაიარეთ უსაფრთხოების შემოწმება.", "We couldn't send your request. Please try again.": "მოთხოვნის გაგზავნა ვერ მოხერხდა. სცადეთ ხელახლა.", Sending: "იგზავნება...",
  "No payment is required at this stage. We'll review your request first.": "ამ ეტაპზე გადახდა არ არის საჭირო. ჯერ განვიხილავთ თქვენს მოთხოვნას.",
  "Your trusted local hands in Georgia.": "თქვენი სანდო ადგილობრივი დამხმარეები საქართველოში.", "Back to top": "ზემოთ", Privacy: "კონფიდენციალურობა", Terms: "პირობები", "Security verification helps protect this form from spam.": "უსაფრთხოების შემოწმება ფორმას სპამისგან იცავს.",
  "REQUEST TRACKING": "მოთხოვნის თვალყურის დევნება", "Loading your request…": "მოთხოვნა იტვირთება…", "We couldn't find this request.": "ეს მოთხოვნა ვერ მოიძებნა.", "Back to LocalGeo": "LocalGeo-ზე დაბრუნება", "Your request": "თქვენი მოთხოვნა", Service: "სერვისი", "Requested for": "შესრულების დრო", Progress: "მიმდინარეობა", "Completion evidence shared": "შესრულების მტკიცებულება გაზიარებულია", "Request received": "მოთხოვნა მიღებულია", "Open proof": "მტკიცებულების გახსნა", "No updates yet.": "განახლებები ჯერ არ არის.", "This private link shows the status of this request only. Keep it safe.": "ეს პირადი ბმული მხოლოდ ამ მოთხოვნის სტატუსს აჩვენებს. შეინახეთ უსაფრთხოდ.",
  "We contacted you": "ჩვენ დაგიკავშირდით", "Task assigned": "შემსრულებელი დანიშნულია", "Task in progress": "დავალება მიმდინარეობს", "Task completed": "დავალება დასრულებულია", "Request cancelled": "მოთხოვნა გაუქმებულია", "This tracking link is invalid or the request is unavailable.": "თვალყურის დევნების ბმული არასწორია ან მოთხოვნა მიუწვდომელია."
};

function translateText(value, language) {
  if (language === "en" || !value) return value;
  const leading = value.match(/^\s*/)?.[0] || "";
  const trailing = value.match(/\s*$/)?.[0] || "";
  const key = value.trim().replace(/\s+/g, " ");
  const dictionary = language === "ru" ? ru : ka;
  return dictionary[key] ? `${leading}${dictionary[key]}${trailing}` : value;
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => localStorage.getItem("localgeo-language") || "en");

  useEffect(() => {
    localStorage.setItem("localgeo-language", language);
    document.documentElement.lang = language;
  }, [language]);

  return <LanguageContext.Provider value={{ language, setLanguage, translateText }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  const languages = [
    ["ka", "ქარ"],
    ["en", "EN"],
    ["ru", "RU"],
  ];

  return (
    <div className="language-toggle" aria-label="Change language">
      {languages.map(([value, label]) => (
        <button
          type="button"
          key={value}
          className={language === value ? "active" : ""}
          onClick={() => setLanguage(value)}
          aria-pressed={language === value}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function LocalizedContent({ children }) {
  const { language } = useLanguage();
  const rootRef = useRef(null);
  const originals = useRef(new WeakMap());

  useEffect(() => {
    if (!rootRef.current) return;

    const walker = document.createTreeWalker(rootRef.current, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let node = walker.nextNode();
    while (node) {
      if (node.parentElement?.tagName !== "SCRIPT" && node.parentElement?.tagName !== "STYLE") nodes.push(node);
      node = walker.nextNode();
    }

    nodes.forEach((textNode) => {
      if (!originals.current.has(textNode)) originals.current.set(textNode, textNode.nodeValue);
      textNode.nodeValue = translateText(originals.current.get(textNode), language);
    });

    rootRef.current.querySelectorAll("[placeholder]").forEach((element) => {
      if (!originals.current.has(element)) originals.current.set(element, element.getAttribute("placeholder"));
      element.setAttribute("placeholder", translateText(originals.current.get(element), language));
    });
  });

  return <div ref={rootRef}>{children}</div>;
}

export function translate(value, language) {
  return translateText(value, language);
}
