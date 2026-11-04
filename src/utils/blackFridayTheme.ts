/**
 * Utilitários do Tema Promocional "Black das Blacks Consórcio Magalu"
 * Vigência oficial: Até 30 de Novembro às 23:59:59
 */

export const getBlackFridayExpiryDate = (): Date => {
  const now = new Date();
  const year = now.getFullYear();
  // 30 de Novembro às 23:59:59 (Mês 10 no JS = Novembro)
  return new Date(year, 10, 30, 23, 59, 59);
};

export const isBlackFridayActive = (): boolean => {
  if (typeof window !== "undefined") {
    const override = localStorage.getItem("force_black_friday");
    if (override === "true") return true;
    if (override === "false") return false;
  }

  const now = new Date();
  const expiry = getBlackFridayExpiryDate();
  
  // Ativo durante todo o mês de novembro até o final do dia 30/11
  const isNovember = now.getMonth() === 10;
  const isBeforeOrAtExpiry = now.getTime() <= expiry.getTime();

  return isNovember && isBeforeOrAtExpiry;
};

export interface BlackFridayRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  formatted: string;
}

export const getBlackFridayRemainingTime = (): BlackFridayRemaining => {
  const now = new Date().getTime();
  const target = getBlackFridayExpiryDate().getTime();
  const diff = target - now;

  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
      formatted: "Encerrado",
    };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  const formatted = `${days}d ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;

  return {
    days,
    hours,
    minutes,
    seconds,
    isExpired: false,
    formatted,
  };
};
