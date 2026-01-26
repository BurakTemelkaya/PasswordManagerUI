/**
 * Kullanıcının browser locale'ini otomatik olarak al
 * Örn: Türkiye → "tr-TR", İngiltere → "en-GB", USA → "en-US"
 * @returns Browser'ın locale kodu
 */
const getBrowserLocale = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale;
  } catch (error) {
    console.error('Locale detection error:', error);
    return 'en-US'; // Fallback
  }
};

/**
 * Backend'den gelen naive tarih string'ini (UTC)
 * kullanıcının local timezone'ına ve diline göre çevir
 * 
 * Backend UTC.Now() döndürüyor ama Z suffix'i olmadan.
 * JavaScript naive string'i local timezone olarak parse eder,
 * bu yüzden string'e Z ekleyerek UTC olarak parse etmeliyiz.
 * 
 * Tarih formatı kullanıcının browser locale'ine göre otomatik seçilir:
 * - Türkiye (tr-TR): 22.01.2026 03:22:19 GMT+3
 * - İngiltere (en-GB): 22/01/2026 03:22:19 GMT+3
 * - USA (en-US): 1/22/2026 03:22:19 AM GMT+3
 * 
 * @param dateString Naive tarih string'i (örn: "2026-01-22T00:22:19.7456817")
 * @param locale Dil kodu (varsayılan: otomatik algılanan browser locale)
 * @returns Kullanıcının diline ve timezone'unda formatlanmış saat
 */
export const formatLocalDateTime = (
  dateString: string,
  locale: string = getBrowserLocale()
): string => {
  try {
    // String'in sonunda Z yoksa ekle (UTC olarak parse etmesi için)
    // Örn: "2026-01-22T00:22:19.7456817" → "2026-01-22T00:22:19.7456817Z"
    const utcString = dateString.includes('Z') ? dateString : dateString + 'Z';
    const date = new Date(utcString);

    // Kullanıcının locale'ine ve timezone'unda formatla
    // Intl API otomatik olarak:
    // - Doğru tarih formatını seçer (., /, - vs)
    // - Doğru ay adlarını seçer (January, Janvier, Janvier, vs)
    // - Doğru gün sırasını seçer (DD/MM/YYYY, MM/DD/YYYY vs)
    const formatted = new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    }).format(date);

    return formatted;
  } catch (error) {
    console.error('Date formatting error:', error);
    return dateString;
  }
};

/**
 * Backend'den gelen naive tarih string'ini sadece tarih olarak formatla
 * Locale otomatik olarak browser'dan algılanır
 * 
 * @param dateString Naive tarih string'i
 * @param locale Dil kodu (varsayılan: otomatik algılanan browser locale)
 * @returns Formatlanmış tarih (örn: Türkiye "22.01.2026", USA "1/22/2026")
 */
export const formatLocalDate = (
  dateString: string,
  locale: string = getBrowserLocale()
): string => {
  try {
    const utcString = dateString.includes('Z') ? dateString : dateString + 'Z';
    const date = new Date(utcString);

    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  } catch (error) {
    console.error('Date formatting error:', error);
    return dateString;
  }
};

/**
 * Backend'den gelen naive tarih string'ini kısa formatta formatla
 * Locale otomatik olarak browser'dan algılanır
 * 
 * @param dateString Naive tarih string'i
 * @param locale Dil kodu (varsayılan: otomatik algılanan browser locale)
 * @returns Formatlanmış saat (örn: "15:30", "03:30 PM")
 */
export const formatLocalTime = (
  dateString: string,
  locale: string = getBrowserLocale()
): string => {
  try {
    const utcString = dateString.includes('Z') ? dateString : dateString + 'Z';
    const date = new Date(utcString);

    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch (error) {
    console.error('Time formatting error:', error);
    return dateString;
  }
};

/**
 * Kullanıcının timezone offset'ini al (dakika cinsinden)
 * @returns Örn: Türkiye +180 (UTC+3), USA -300 (UTC-5)
 */
export const getUserTimezoneOffset = (): number => {
  return new Date().getTimezoneOffset() * -1; // * -1 çünkü JS negative döndürüyor
};

/**
 * Kullanıcının timezone'unu al (IANA format)
 * @returns Örn: "Europe/Istanbul", "America/New_York"
 */
export const getUserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.error('Timezone detection error:', error);
    return 'UTC';
  }
};
