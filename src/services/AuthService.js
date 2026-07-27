import { loginWithGoogle, logoutFirebase } from '../firebase/auth';

class AuthService {
  /**
   * 👔 Вход для сотрудников
   */
  static loginStaff(phone, password, rolesData, lang) {
    const staffMember = (rolesData || {})[phone];
    
    if (!staffMember) {
      throw new Error(lang === 'ru' ? "Неверный логин сотрудника!" : "Қызметкердің логині қате!");
    }
    if (staffMember.password !== password) {
      throw new Error(lang === 'ru' ? "Неверный пароль!" : "Құпия сөз қате!");
    }
    if (!staffMember.onShift && staffMember.role !== 'admin' && staffMember.role !== 'developer') {
      throw new Error(lang === 'ru' ? "Сегодня не ваша смена!" : "Бүгін сіздің ауысымыңыз емес!");
    }

    const sessionToken = Date.now().toString(36) + Math.random().toString(36).substring(2);
    
    return {
      user: {
        role: staffMember.role,
        phone: phone,
        name: staffMember.name,
        station: staffMember.station || null,
        isSenior: staffMember.isSenior || false,
        sessionToken,
        isAnonymous: false
      },
      updatedStaffData: { ...staffMember, sessionToken }
    };
  }

  /**
   * 🍔 Вход для гостей (через Google)
   */
  static async loginGuest(customersData) {
    try {
      const googleUser = await loginWithGoogle();
      const userId = googleUser.email; // Используем email как ID
      const userName = googleUser.displayName || 'Гость';
      
      let customerProfile = (customersData || {})[userId];

      // Если новый гость — создаем профиль и даем бонусы
      if (!customerProfile) {
        customerProfile = {
          phone: userId,
          name: userName,
          bonuses: 500, // 🎁 Те самые приветственные бонусы
          sessionToken: null
        };
      }

      const sessionToken = Date.now().toString(36) + Math.random().toString(36).substring(2);
      customerProfile.sessionToken = sessionToken;

      return {
        user: {
          role: 'guest',
          phone: userId,
          name: userName,
          station: null,
          sessionToken,
          isAnonymous: false
        },
        updatedCustomerData: customerProfile,
        userId
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * 🚪 Выход из системы
   */
  static async logout() {
    await logoutFirebase();
  }
}

export default AuthService;

