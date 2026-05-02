export type Language = 'en' | 'nl' | 'es';

export interface ErrorMessages {
    duplicateCV: string;
    requiredFields: string;
    aiNotConfigured: string;
    cvNotFound: string;
    noVacancies: string;
    cvInsufficientText: string;
    noVacanciesWithEmbeddings: string;
    matchingFailed: string;
}

export const errorMessages: Record<Language, ErrorMessages> = {
    en: {
        duplicateCV: 'A CV with this name and work experience already exists. Contact us if you want to update your CV.',
        requiredFields: 'Name and email are required',
        aiNotConfigured: 'AI matching is not configured',
        cvNotFound: 'CV not found',
        noVacancies: 'No vacancies available yet',
        cvInsufficientText: 'CV has insufficient text for matching',
        noVacanciesWithEmbeddings: 'No vacancies with embeddings found.',
        matchingFailed: 'Matching failed',
    },
    nl: {
        duplicateCV: 'Er bestaat al een CV met deze naam en werkervaring. Neem contact op als je je CV wilt bijwerken.',
        requiredFields: 'Naam en e-mail zijn verplicht',
        aiNotConfigured: 'AI matching is niet geconfigureerd',
        cvNotFound: 'CV niet gevonden',
        noVacancies: 'Nog geen vacatures beschikbaar',
        cvInsufficientText: 'CV heeft onvoldoende tekst voor matching',
        noVacanciesWithEmbeddings: 'Geen vacatures met embeddings gevonden.',
        matchingFailed: 'Matching mislukt',
    },
    es: {
        duplicateCV: 'Ya existe un CV con este nombre y experiencia laboral. Contáctanos si deseas actualizar tu CV.',
        requiredFields: 'Nombre y correo electrónico son obligatorios',
        aiNotConfigured: 'La coincidencia AI no está configurada',
        cvNotFound: 'CV no encontrado',
        noVacancies: 'Aún no hay vacantes disponibles',
        cvInsufficientText: 'El CV no tiene suficiente texto para la coincidencia',
        noVacanciesWithEmbeddings: 'No se encontraron vacantes con embeddings.',
        matchingFailed: 'La coincidencia falló',
    },
};

export interface ParseMessages {
    noFile: string;
    unsupportedFormat: string;
    parseError: string;
    aiNotConfigured: string;
    textTooShort: string;
}

export const parseMessages: Record<Language, ParseMessages> = {
    en: {
        noFile: 'No file provided',
        unsupportedFormat: 'Unsupported file format. Please upload PDF or Word (.docx)',
        parseError: 'Error parsing CV',
        aiNotConfigured: 'AI parsing is not configured',
        textTooShort: 'Could not extract enough text from the file',
    },
    nl: {
        noFile: 'Geen bestand aangeleverd',
        unsupportedFormat: 'Niet-ondersteund bestandsformaat. Upload PDF of Word (.docx)',
        parseError: 'Fout bij het analyseren van CV',
        aiNotConfigured: 'AI parsing is niet geconfigureerd',
        textTooShort: 'Kon niet genoeg tekst uit het bestand halen',
    },
    es: {
        noFile: 'No se proporcionó ningún archivo',
        unsupportedFormat: 'Formato no soportado. Suba PDF o Word (.docx)',
        parseError: 'Error al analizar el CV',
        aiNotConfigured: 'El análisis AI no está configurado',
        textTooShort: 'No se pudo extraer suficiente texto del archivo',
    },
};
