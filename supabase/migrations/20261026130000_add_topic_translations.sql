-- Fluency Mind — traduções de topics (en-US/es). `title`/`description` continuam
-- sendo o pt-BR histórico (não renomeados, pra não quebrar código/queries
-- existentes); as colunas novas são opcionais e o app cai pro pt-BR se uma
-- tradução faltar (ver SupabaseTopicRepository).

alter table topics
  add column title_en_us text,
  add column title_es text,
  add column description_en_us text,
  add column description_es text;

update topics set
  title_en_us = 'Daily routine',
  title_es = 'Rutina diaria',
  description_en_us = 'Talk about what a normal day looks like for you: work, studies, free time.',
  description_es = 'Habla sobre cómo es un día normal en tu vida: trabajo, estudio, tiempo libre.'
where slug = 'daily-routine';

update topics set
  title_en_us = 'Travel',
  title_es = 'Viajes',
  description_en_us = 'Tell us about a trip you''ve taken or would like to take.',
  description_es = 'Cuéntanos sobre un viaje que hiciste o te gustaría hacer.'
where slug = 'travel';

update topics set
  title_en_us = 'Food and cooking',
  title_es = 'Comida y cocina',
  description_en_us = 'Talk about your favorite dishes, restaurants, and eating habits.',
  description_es = 'Habla sobre tus platos favoritos, restaurantes y hábitos alimenticios.'
where slug = 'food';

update topics set
  title_en_us = 'Hobbies and free time',
  title_es = 'Pasatiempos y tiempo libre',
  description_en_us = 'Talk about what you do in your free time.',
  description_es = 'Habla sobre lo que haces en tu tiempo libre.'
where slug = 'hobbies';

update topics set
  title_en_us = 'Job interview',
  title_es = 'Entrevista de trabajo',
  description_en_us = 'Practice introducing yourself and answering common interview questions.',
  description_es = 'Practica cómo presentarte y responder preguntas comunes de una entrevista.'
where slug = 'job-interview';

update topics set
  title_en_us = 'Tech career',
  title_es = 'Carrera en tecnología',
  description_en_us = 'Talk about your professional experience in tech, projects, and challenges.',
  description_es = 'Habla sobre tu experiencia profesional en tecnología, proyectos y desafíos.'
where slug = 'tech-career';

update topics set
  title_en_us = 'Small talk',
  title_es = 'Conversación informal',
  description_en_us = 'Practice short, casual conversations, like in an elevator or a line.',
  description_es = 'Practica conversaciones cortas e informales, como en un ascensor o una fila.'
where slug = 'small-talk';

update topics set
  title_en_us = 'Opinions on current news',
  title_es = 'Opiniones sobre noticias actuales',
  description_en_us = 'Discuss current topics and defend points of view with arguments.',
  description_es = 'Debate temas actuales y defiende puntos de vista con argumentos.'
where slug = 'opinions-news';

update topics set
  title_en_us = 'Movies and TV shows',
  title_es = 'Películas y series',
  description_en_us = 'Talk about your favorite movies and shows, recommendations, and reviews.',
  description_es = 'Habla sobre tus películas y series favoritas, recomendaciones y críticas.'
where slug = 'movies-series';

update topics set
  title_en_us = 'Future plans',
  title_es = 'Planes para el futuro',
  description_en_us = 'Talk about personal and professional goals, short and long term.',
  description_es = 'Habla sobre metas personales y profesionales a corto y largo plazo.'
where slug = 'future-plans';
