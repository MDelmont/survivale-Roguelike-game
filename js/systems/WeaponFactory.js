import { ProjectileWeapon, OrbitalWeapon, AreaWeapon } from '../entities/Weapon.js';

/**
 * WeaponFactory
 * Crée des instances d'armes à partir des données JSON.
 */
export class WeaponFactory {
    static create(weaponData, assetManager) {
        if (!weaponData) return null;

        const { id, name, type, stats, upgrades, visuals } = weaponData;

        switch (type) {
            case 'attack':
                return new ProjectileWeapon(id, name, stats, upgrades, visuals);
            case 'defense':
                return new OrbitalWeapon(id, name, stats, upgrades, visuals, assetManager);
            case 'aoe':
                return new AreaWeapon(id, name, stats, upgrades, visuals, assetManager);
            default:
                console.warn(`Type d'arme inconnu : ${type}`);
                return null;
        }
    }
}


