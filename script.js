class NetbarSystem {
    constructor() {
        this.hourlyRate = 10; 
        this.initialBalance = 100; 
        this.totalRecharge = 0; 
        this.usedSeconds = 0; 
        this.remainingBalance = this.initialBalance; 
        this.remainingTime = this.calculateTimeFromBalance(this.remainingBalance); 
        this.consumedAmount = 0; 
        this.isRunning = true;
        this.timerInterval = null;
        this.callCount = 0;
        this.isIdle = false;
        this.unlockPassword = '123456'; 
        this.isUnlockSectionVisible = false;
        this.isLoggedIn = true;

        this.init();
    }

    calculateTimeFromBalance(balance) {
        const hours = Math.floor(balance / this.hourlyRate);
        const remainingBalance = balance % this.hourlyRate;
        const minutes = Math.floor((remainingBalance / this.hourlyRate) * 60);
        const seconds = Math.floor(((remainingBalance / this.hourlyRate) * 60 - minutes) * 60);
        return { hours, minutes, seconds };
    }

    calculateBalanceFromTime(time) {
        const totalHours = time.hours + time.minutes / 60 + time.seconds / 3600;
        return totalHours * this.hourlyRate;
    }

    formatTime(time) {
        const hours = String(time.hours).padStart(2, '0');
        const minutes = String(time.minutes).padStart(2, '0');
        const seconds = String(time.seconds).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }

    formatCurrency(amount) {
        return `¥${amount.toFixed(2)}`;
    }

    updateDisplay() {
        document.getElementById('remaining-balance').textContent = this.formatCurrency(this.remainingBalance);
        document.getElementById('remaining-time').textContent = this.formatTime(this.remainingTime);
        document.getElementById('consumed-amount').textContent = this.formatCurrency(this.consumedAmount);
    }

    updateConsumedAndBalance() {
        const secondsPerHour = 3600;
        const ratePerSecond = this.hourlyRate / secondsPerHour;
        
        this.consumedAmount = this.usedSeconds * ratePerSecond;
        
        this.remainingBalance = this.initialBalance + this.totalRecharge - this.consumedAmount;
        
        if (this.remainingBalance < 0) {
            this.remainingBalance = 0;
        }
        
        this.remainingTime = this.calculateTimeFromBalance(this.remainingBalance);
    }

    startTimer() {
        if (this.timerInterval) return;

        this.timerInterval = setInterval(() => {
            if (!this.isRunning) return;

            this.usedSeconds++;
            
            this.updateConsumedAndBalance();

            if (this.remainingBalance <= 0) {
                this.stopTimer();
                this.showToast('网费已用完，请及时充值！', 'error');
                return;
            }

            this.updateDisplay();
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.isRunning = false;
    }

    setOfflineState() {
        this.isLoggedIn = false;
        this.stopTimer();

        const statusIndicator = document.querySelector('.status-indicator');
        statusIndicator.classList.add('offline');
        document.querySelector('.status-text').textContent = '已下机';

        const checkoutBtn = document.getElementById('checkout-btn');
        const idleBtn = document.getElementById('idle-btn');
        const rechargeBtn = document.getElementById('recharge-btn');
        const callBtn = document.getElementById('call-btn');
        const loginBtn = document.getElementById('login-btn');

        checkoutBtn.classList.add('disabled');
        idleBtn.classList.add('disabled');
        rechargeBtn.classList.add('disabled');
        callBtn.classList.add('disabled');
        loginBtn.style.display = 'flex';
    }

    setOnlineState() {
        this.isLoggedIn = true;
        this.isRunning = true;

        const statusIndicator = document.querySelector('.status-indicator');
        statusIndicator.classList.remove('offline');
        document.querySelector('.status-text').textContent = '在线';

        const checkoutBtn = document.getElementById('checkout-btn');
        const idleBtn = document.getElementById('idle-btn');
        const rechargeBtn = document.getElementById('recharge-btn');
        const callBtn = document.getElementById('call-btn');
        const loginBtn = document.getElementById('login-btn');

        checkoutBtn.classList.remove('disabled');
        idleBtn.classList.remove('disabled');
        rechargeBtn.classList.remove('disabled');
        callBtn.classList.remove('disabled');
        loginBtn.style.display = 'none';
    }

    recharge(amount) {
        if (!this.isLoggedIn) {
            this.showToast('请先重新上机！', 'error');
            return;
        }

        if (amount <= 0) {
            this.showToast('请输入有效的充值金额！', 'error');
            return;
        }

        this.totalRecharge += amount;
        
        this.updateConsumedAndBalance();
        
        this.updateDisplay();
        this.showToast(`充值成功！已充值 ${this.formatCurrency(amount)}`, 'success');
        
        if (!this.isRunning && this.remainingBalance > 0) {
            this.isRunning = true;
            this.startTimer();
        }
    }

    checkout() {
        if (!this.isLoggedIn) {
            this.showToast('您已经下机了！', 'error');
            return;
        }

        this.stopTimer();
        this.showModal('checkout-modal');
        
        document.getElementById('checkout-balance').textContent = this.formatCurrency(this.remainingBalance);
        document.getElementById('checkout-consumed').textContent = this.formatCurrency(this.consumedAmount);
    }

    confirmCheckout() {
        this.hideModal('checkout-modal');
        this.setOfflineState();
        this.showToast(`结账成功！已消费 ${this.formatCurrency(this.consumedAmount)}，剩余 ${this.formatCurrency(this.remainingBalance)}`, 'success');
    }

    login() {
        if (this.isLoggedIn) {
            this.showToast('您已经在线了！', 'error');
            return;
        }

        this.setOnlineState();
        
        if (this.remainingBalance > 0) {
            this.isRunning = true;
            this.startTimer();
            this.showToast('重新上机成功！会话已开始', 'success');
        } else {
            this.showToast('余额不足，请先充值！', 'error');
        }
    }

    enterIdleMode() {
        if (!this.isLoggedIn) {
            this.showToast('请先重新上机！', 'error');
            return;
        }

        this.isIdle = true;
        this.isUnlockSectionVisible = false;
        this.showModal('idle-modal');
        document.getElementById('unlock-section').style.display = 'none';
        document.getElementById('unlock-password').value = '';
    }

    showUnlockSection() {
        if (!this.isIdle) return;
        
        this.isUnlockSectionVisible = true;
        document.getElementById('unlock-section').style.display = 'block';
        
        setTimeout(() => {
            document.getElementById('unlock-password').focus();
        }, 100);
    }

    verifyPassword() {
        const inputPassword = document.getElementById('unlock-password').value;
        
        if (inputPassword === this.unlockPassword) {
            this.exitIdleMode();
            return true;
        } else {
            this.showToast('密码错误，请重新输入！', 'error');
            document.getElementById('unlock-password').value = '';
            document.getElementById('unlock-password').focus();
            return false;
        }
    }

    exitIdleMode() {
        this.isIdle = false;
        this.isUnlockSectionVisible = false;
        this.hideModal('idle-modal');
        document.getElementById('unlock-section').style.display = 'none';
        document.getElementById('unlock-password').value = '';
        this.showToast('已退出挂机模式', 'success');
    }

    callService() {
        if (!this.isLoggedIn) {
            this.showToast('请先重新上机！', 'error');
            return;
        }

        this.callCount++;
        if (this.callCount === 1) {
            this.showToast('已呼叫网管，请稍候...', 'success');
        } else {
            this.showToast(`已重复呼叫网管 (${this.callCount}次)，请稍候...`, 'success');
        }
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = 'toast';
        toast.classList.add(type, 'active');

        setTimeout(() => {
            toast.classList.remove('active');
        }, 3000);
    }

    initEventListeners() {
        document.getElementById('checkout-btn').addEventListener('click', () => {
            this.checkout();
        });

        document.getElementById('idle-btn').addEventListener('click', () => {
            this.enterIdleMode();
        });

        document.getElementById('recharge-btn').addEventListener('click', () => {
            if (!this.isLoggedIn) {
                this.showToast('请先重新上机！', 'error');
                return;
            }
            this.showModal('recharge-modal');
        });

        document.getElementById('call-btn').addEventListener('click', () => {
            this.callService();
        });

        document.getElementById('login-btn').addEventListener('click', () => {
            this.login();
        });

        document.querySelectorAll('.recharge-option').forEach(button => {
            button.addEventListener('click', () => {
                const amount = parseFloat(button.dataset.amount);
                this.recharge(amount);
                this.hideModal('recharge-modal');
            });
        });

        document.getElementById('custom-amount-btn').addEventListener('click', () => {
            const input = document.getElementById('custom-amount-input');
            const amount = parseFloat(input.value);
            
            if (isNaN(amount) || amount <= 0) {
                this.showToast('请输入有效的充值金额！', 'error');
                return;
            }
            
            this.recharge(amount);
            input.value = '';
            this.hideModal('recharge-modal');
        });

        document.getElementById('close-recharge-modal').addEventListener('click', () => {
            this.hideModal('recharge-modal');
        });

        document.getElementById('close-checkout-modal').addEventListener('click', () => {
            this.hideModal('checkout-modal');
            if (this.isLoggedIn) {
                this.isRunning = true;
                this.startTimer();
            }
        });

        document.getElementById('cancel-checkout').addEventListener('click', () => {
            this.hideModal('checkout-modal');
            if (this.isLoggedIn) {
                this.isRunning = true;
                this.startTimer();
            }
        });

        document.getElementById('confirm-checkout').addEventListener('click', () => {
            this.confirmCheckout();
        });

        document.getElementById('recharge-modal').addEventListener('click', (e) => {
            if (e.target.id === 'recharge-modal') {
                this.hideModal('recharge-modal');
            }
        });

        document.getElementById('checkout-modal').addEventListener('click', (e) => {
            if (e.target.id === 'checkout-modal') {
                this.hideModal('checkout-modal');
                if (this.isLoggedIn) {
                    this.isRunning = true;
                    this.startTimer();
                }
            }
        });

        document.getElementById('custom-amount-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('custom-amount-btn').click();
            }
        });

        document.getElementById('idle-modal').addEventListener('click', (e) => {
            if (this.isIdle && !this.isUnlockSectionVisible) {
                this.showUnlockSection();
            }
        });

        document.getElementById('unlock-btn').addEventListener('click', () => {
            this.verifyPassword();
        });

        document.getElementById('unlock-password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.verifyPassword();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (this.isIdle) {
                if (!this.isUnlockSectionVisible) {
                    e.preventDefault();
                    this.showUnlockSection();
                }
            }
        });

        document.getElementById('unlock-password').addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
            }
        });
    }

    init() {
        this.updateDisplay();
        this.initEventListeners();
        this.startTimer();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new NetbarSystem();
});