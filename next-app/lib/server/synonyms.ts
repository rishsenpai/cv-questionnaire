export const stopwords: Set<string> = new Set([
    // Dutch
    'de', 'het', 'een', 'van', 'en', 'in', 'is', 'op', 'te', 'dat', 'die', 'voor',
    'met', 'zijn', 'aan', 'wordt', 'als', 'naar', 'bij', 'om', 'ook', 'tot', 'uit',
    'maar', 'door', 'over', 'dan', 'nog', 'wel', 'geen', 'moet', 'kan', 'zou', 'zeer',
    'meer', 'veel', 'hebben', 'worden', 'jaar', 'jaren', 'binnen', 'onder', 'tussen',
    // English
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
    'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need',
    'this', 'that', 'these', 'those', 'what', 'which', 'who', 'whom', 'where', 'when',
    'how', 'why', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some',
    'such', 'only', 'own', 'same', 'than', 'too', 'very', 'just', 'also', 'now', 'here',
]);

export const synonyms: Record<string, string[]> = {
    // === FUNCTIETITELS / JOB TITLES ===
    'developer': ['ontwikkelaar', 'programmeur', 'developer', 'dev', 'coder'],
    'ontwikkelaar': ['developer', 'programmeur', 'ontwikkelaar', 'dev', 'coder'],
    'programmeur': ['developer', 'ontwikkelaar', 'programmeur', 'dev', 'coder'],
    'dev': ['developer', 'ontwikkelaar', 'programmeur'],
    'coder': ['developer', 'ontwikkelaar', 'programmeur'],
    'engineer': ['ingenieur', 'engineer', 'technicus'],
    'ingenieur': ['engineer', 'ingenieur', 'technicus'],
    'technicus': ['engineer', 'ingenieur', 'technician'],
    'technician': ['technicus', 'engineer'],
    'manager': ['beheerder', 'manager', 'leider', 'leidinggevende', 'hoofd', 'directeur'],
    'beheerder': ['manager', 'beheerder', 'administrator', 'admin'],
    'leider': ['manager', 'leider', 'lead', 'hoofd', 'leidinggevende'],
    'leidinggevende': ['manager', 'leider', 'lead', 'supervisor'],
    'hoofd': ['manager', 'leider', 'lead', 'head', 'chief'],
    'directeur': ['director', 'manager', 'ceo', 'bestuurder'],
    'director': ['directeur', 'manager', 'hoofd'],
    'senior': ['senior', 'ervaren', 'sr', 'experienced', 'lead'],
    'junior': ['junior', 'jr', 'starter', 'trainee', 'beginnend'],
    'medior': ['medior', 'mid', 'middle', 'gevorderd'],
    'trainee': ['junior', 'starter', 'trainee', 'stagiair'],
    'stagiair': ['trainee', 'intern', 'stagiaire', 'stage'],
    'intern': ['stagiair', 'trainee', 'stage'],
    'analyst': ['analist', 'analyst', 'analyzer'],
    'analist': ['analyst', 'analist'],
    'designer': ['ontwerper', 'designer', 'vormgever'],
    'ontwerper': ['designer', 'ontwerper', 'vormgever'],
    'vormgever': ['designer', 'ontwerper'],
    'consultant': ['adviseur', 'consultant', 'advisor', 'raadgever'],
    'adviseur': ['consultant', 'adviseur', 'advisor'],
    'advisor': ['consultant', 'adviseur'],
    'architect': ['architect', 'solution architect', 'solutions'],
    'specialist': ['specialist', 'expert', 'deskundige', 'professional'],
    'expert': ['specialist', 'expert', 'deskundige'],
    'deskundige': ['specialist', 'expert'],
    'coordinator': ['coordinator', 'coördinator'],
    'coördinator': ['coordinator', 'coördinator'],
    // === FRONTEND/BACKEND/FULLSTACK ===
    'frontend': ['frontend', 'front-end', 'front', 'ui', 'client-side', 'clientside'],
    'backend': ['backend', 'back-end', 'back', 'server-side', 'serverside', 'api'],
    'fullstack': ['fullstack', 'full-stack', 'full', 'stack'],
    'webdeveloper': ['webontwikkelaar', 'web developer', 'webdev'],
    'webontwikkelaar': ['webdeveloper', 'web developer', 'webdev'],
    // === TALEN / LANGUAGES ===
    'javascript': ['javascript', 'js', 'ecmascript', 'es6', 'node', 'nodejs'],
    'typescript': ['typescript', 'ts'],
    'python': ['python', 'py', 'django', 'flask'],
    'java': ['java', 'jvm', 'spring', 'springboot'],
    'csharp': ['csharp', 'c#', '.net', 'dotnet', 'asp.net'],
    'php': ['php', 'laravel', 'symfony', 'wordpress'],
    'ruby': ['ruby', 'rails', 'rubyonrails'],
    'golang': ['golang', 'go'],
    'rust': ['rust', 'rustlang'],
    'swift': ['swift', 'ios', 'xcode'],
    'kotlin': ['kotlin', 'android'],
    'scala': ['scala', 'jvm'],
    'sql': ['sql', 'mysql', 'postgresql', 'postgres', 'mssql', 'oracle', 'database'],
    'html': ['html', 'html5', 'markup'],
    'css': ['css', 'css3', 'sass', 'scss', 'less', 'styling'],
    // === FRAMEWORKS & LIBRARIES ===
    'react': ['react', 'reactjs', 'react.js', 'redux', 'nextjs', 'next.js'],
    'angular': ['angular', 'angularjs', 'angular.js'],
    'vue': ['vue', 'vuejs', 'vue.js', 'nuxt', 'nuxtjs'],
    'node': ['node', 'nodejs', 'node.js', 'express', 'expressjs'],
    'spring': ['spring', 'springboot', 'spring boot', 'java'],
    'django': ['django', 'python', 'flask'],
    'laravel': ['laravel', 'php', 'symfony'],
    'dotnet': ['dotnet', '.net', 'asp.net', 'csharp', 'c#'],
    // === DATA & AI ===
    'data': ['data', 'gegevens', 'informatie', 'analytics'],
    'database': ['database', 'databank', 'db', 'sql', 'nosql'],
    'machinelearning': ['machine learning', 'ml', 'ai', 'artificial intelligence'],
    'ai': ['ai', 'artificial intelligence', 'kunstmatige intelligentie', 'machine learning', 'ml'],
    'datascience': ['data science', 'datascience', 'data scientist', 'analytics'],
    'bigdata': ['big data', 'bigdata', 'hadoop', 'spark'],
    'analytics': ['analytics', 'analyse', 'analysis', 'bi', 'business intelligence'],
    'bi': ['bi', 'business intelligence', 'analytics', 'reporting'],
    // === CLOUD & DEVOPS ===
    'devops': ['devops', 'dev ops', 'operations', 'sre', 'platform'],
    'cloud': ['cloud', 'aws', 'azure', 'gcp', 'google cloud'],
    'aws': ['aws', 'amazon', 'amazon web services', 'cloud'],
    'azure': ['azure', 'microsoft azure', 'cloud'],
    'gcp': ['gcp', 'google cloud', 'google cloud platform', 'cloud'],
    'kubernetes': ['kubernetes', 'k8s', 'container', 'docker'],
    'docker': ['docker', 'container', 'containerization', 'kubernetes'],
    'cicd': ['cicd', 'ci/cd', 'continuous integration', 'continuous deployment', 'jenkins', 'gitlab'],
    'linux': ['linux', 'unix', 'ubuntu', 'centos', 'redhat'],
    'windows': ['windows', 'microsoft', 'server'],
    // === TESTING / QA ===
    'tester': ['tester', 'qa', 'test', 'quality', 'testautomation'],
    'qa': ['qa', 'quality assurance', 'tester', 'testing', 'kwaliteit'],
    'testing': ['testing', 'testen', 'test', 'qa'],
    'automation': ['automation', 'automatisering', 'automated', 'geautomatiseerd'],
    'selenium': ['selenium', 'testing', 'testautomation'],
    // === AGILE & PROJECTMANAGEMENT ===
    'scrum': ['scrum', 'agile', 'sprint', 'kanban'],
    'agile': ['agile', 'scrum', 'kanban', 'lean'],
    'kanban': ['kanban', 'agile', 'lean'],
    'projectmanager': ['projectmanager', 'project manager', 'pm', 'projectleider'],
    'projectleider': ['projectleider', 'projectmanager', 'project manager', 'pm'],
    'productowner': ['product owner', 'po', 'productmanager'],
    'scrummaster': ['scrum master', 'scrummaster', 'agile coach'],
    // === SECURITY ===
    'security': ['security', 'beveiliging', 'cybersecurity', 'infosec'],
    'beveiliging': ['security', 'beveiliging', 'cybersecurity'],
    'cybersecurity': ['cybersecurity', 'security', 'infosec', 'beveiliging'],
    // === NETWERK & SYSTEEM ===
    'netwerk': ['netwerk', 'network', 'networking'],
    'network': ['network', 'netwerk', 'networking', 'infrastructure'],
    'systeem': ['systeem', 'system', 'systems'],
    'system': ['system', 'systeem', 'systems'],
    'infrastructure': ['infrastructure', 'infrastructuur', 'infra'],
    'infrastructuur': ['infrastructuur', 'infrastructure', 'infra'],
    'systeembeheer': ['systeembeheer', 'system administration', 'sysadmin'],
    'sysadmin': ['sysadmin', 'systeembeheer', 'system administrator'],
    // === UX/UI ===
    'ux': ['ux', 'user experience', 'gebruikerservaring', 'usability'],
    'ui': ['ui', 'user interface', 'gebruikersinterface', 'frontend'],
    'uxdesigner': ['ux designer', 'ux ontwerper', 'user experience designer'],
    'uidesigner': ['ui designer', 'ui ontwerper', 'user interface designer'],
    // === BUSINESS & FINANCE ===
    'finance': ['finance', 'financieel', 'financial', 'financiën'],
    'financieel': ['financieel', 'finance', 'financial'],
    'accounting': ['accounting', 'boekhouding', 'accountant'],
    'boekhouding': ['boekhouding', 'accounting', 'administratie'],
    'sales': ['sales', 'verkoop', 'commercial', 'commercieel'],
    'verkoop': ['verkoop', 'sales', 'commercial'],
    'marketing': ['marketing', 'marketeer', 'digital marketing'],
    'hr': ['hr', 'human resources', 'personeelszaken', 'recruitment'],
    'recruitment': ['recruitment', 'werving', 'hr', 'recruiter'],
    'administratie': ['administratie', 'administration', 'admin', 'office'],
    // === SUPPORT & SERVICE ===
    'support': ['support', 'ondersteuning', 'helpdesk', 'service desk'],
    'helpdesk': ['helpdesk', 'support', 'service desk', 'it support'],
    'klantenservice': ['klantenservice', 'customer service', 'klantcontact'],
    'customerservice': ['customer service', 'klantenservice', 'support'],
    // === OPLEIDING / EDUCATION ===
    'hbo': ['hbo', 'bachelor', 'hogeschool'],
    'wo': ['wo', 'master', 'universiteit', 'university', 'academisch'],
    'mbo': ['mbo', 'beroepsonderwijs'],
    'bachelor': ['bachelor', 'hbo', 'bsc', 'ba'],
    'master': ['master', 'wo', 'msc', 'ma'],
    'phd': ['phd', 'doctor', 'doctorate', 'promotie'],
    // === SOFT SKILLS ===
    'communicatie': ['communicatie', 'communication', 'communicatief'],
    'communication': ['communication', 'communicatie'],
    'leiderschap': ['leiderschap', 'leadership', 'leidinggevend'],
    'leadership': ['leadership', 'leiderschap'],
    'teamwork': ['teamwork', 'samenwerken', 'teamplayer', 'teamspeler'],
    'samenwerken': ['samenwerken', 'teamwork', 'collaboration'],
    'probleemoplossend': ['probleemoplossend', 'problem solving', 'analytisch'],
    'analytisch': ['analytisch', 'analytical', 'analyse'],
    // === CONTRACTVORMEN ===
    'fulltime': ['fulltime', 'full-time', 'voltijd', 'vast'],
    'parttime': ['parttime', 'part-time', 'deeltijd'],
    'freelance': ['freelance', 'zzp', 'zelfstandig', 'contractor', 'interim'],
    'zzp': ['zzp', 'freelance', 'zelfstandig', 'contractor'],
    'interim': ['interim', 'tijdelijk', 'freelance', 'contractor'],
};

export function getWordWithSynonyms(word: string): string[] {
    const terms = new Set<string>([word]);
    const list = synonyms[word];
    if (list) list.forEach(syn => terms.add(syn));
    return Array.from(terms).map(t => `\\b${t}\\b`);
}

export function tokenize(text: string | undefined, expandSynonyms = false): string[] {
    const words = (text || '')
        .toLowerCase()
        .replace(/[^a-zA-Z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2 && !stopwords.has(w));
    if (!expandSynonyms) return words;
    const expanded = new Set<string>(words);
    words.forEach(word => {
        const list = synonyms[word];
        if (list) list.forEach(syn => expanded.add(syn));
    });
    return Array.from(expanded);
}
