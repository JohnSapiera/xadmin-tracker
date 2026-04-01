// config.js
export const weaponMap = {
    "SIG-3A14D65A": "REDMI NOTE 14 PRO 5G",
    "SIG-5B0D3A5C": "REALME 8 PRO",
    "SIG-K882190": "XIAOMI REDMI NOTE 13",
    "SIG-P001234": "POCO X6 PRO",
    "SIG-V009988": "VIVO V30"
};

export const getWeaponName = (sigID) => {
    return weaponMap[sigID] || sigID; // Ibalik ang ID kung wala sa listahan
};
