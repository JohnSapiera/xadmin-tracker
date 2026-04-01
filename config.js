// config.js
export const weaponMap = {
    "SIG-82A9E4B": "SAMSUNG S23 ULTRA",
    "SIG-X921FFA": "IPHONE 15 PRO",
    "SIG-K882190": "XIAOMI REDMI NOTE 13",
    "SIG-P001234": "POCO X6 PRO",
    "SIG-V009988": "VIVO V30"
};

export const getWeaponName = (sigID) => {
    return weaponMap[sigID] || sigID; // Ibalik ang ID kung wala sa listahan
};
