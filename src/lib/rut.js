/**
 * Validates a Chilean RUT
 * @param {string} rut 
 * @returns {boolean}
 */
export function validateRut(rut) {
    if (!rut || typeof rut !== 'string') return false;
    
    const clean = rut.replace(/[^0-9kK]/g, '').toUpperCase();
    if (clean.length < 2) return false;
    
    const body = clean.slice(0, -1);
    const dv = clean.slice(-1);
    
    let sum = 0;
    let mul = 2;
    
    for (let i = body.length - 1; i >= 0; i--) {
        sum += parseInt(body[i]) * mul;
        mul = mul === 7 ? 2 : mul + 1;
    }
    
    const expectedDv = 11 - (sum % 11);
    const finalDv = expectedDv === 11 ? '0' : expectedDv === 10 ? 'K' : expectedDv.toString();
    
    return dv === finalDv;
}

/**
 * Formats a Chilean RUT
 * @param {string} rut 
 * @returns {string}
 */
export function formatRut(rut) {
    if (!rut) return '';
    const clean = rut.replace(/[^0-9kK]/g, '').toUpperCase();
    if (clean.length < 2) return clean;
    
    const body = clean.slice(0, -1);
    const dv = clean.slice(-1);
    
    let formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${formatted}-${dv}`;
}
