class NetbarSystem {
    constructor() {
        this.hourlyRate = 10; 
        this.remainingBalance = 100; 
        this.remainingTime = this.calculateTimeFromBalance(this.remainingBalance); 
        this.consumedAmount = 0; 
        this.isRunning = true;
        this.timerInterval = null;
        this.callCount = 0;

        this.init();
    }

    calculateTimeFromBalance(balance) {
        const hours = Math.floor(balance / this.hourlyRate);
        const minutes = Math.floor((balance % this.hourlyRate) / this.hourlyRate * 60);
        const seconds = 0;
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

    startTimer() {
        if (this.timerInterval) return;

        this.timerInterval = setInterval(() => {
            if (!this.isRunning) return;

            if (this.remainingTime.seconds > 0) {
                this.remainingTime.seconds--;
            } else if (this.remainingTime.minutes > 0) {
                this.remainingTime.minutes--;
                this.remainingTime.seconds = 59;
            } else if (this.remainingTime.hours > 0) {
                this.remainingTime.hours--;
                this.remainingTime.minutes = 59;
                this.remainingTime.seconds = 59;
            } else {
                this.stopTimer();
                this.showToast('网费已用完，请及时充值！', 'error');
                return;
            }

            this.remainingBalance = this.calculateBalanceFromTime(this.remainingTime);
            this.consumedAmount = 100 - this.remainingBalance;

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

    recharge(amount) {
        if (amount <= 0) {
            this.showToast('请输入有效的充值金额！', 'error');
            return;
        }

        this.remainingBalance += amount;
        this.remainingTime = this.calculateTimeFromBalance(this.remainingBalance);
        
        this.updateDisplay();
        this.showToast(`充值成功！已充值 ${this.formatCurrency(amount)}`, 'success');
        
        if (!this.isRunning && this.remainingBalance > 0) {
            this.isRunning = true;
            this.startTimer();
        }
    }

    checkout() {
        this.stopTimer();
        this.showModal('checkout-modal');
        
        document.getElementById('checkout-balance').textContent = this.formatCurrency(this.remainingBalance);
        document.getElementById('checkout-consumed').textContent = this.formatCurrency(this.consumedAmount);
    }

    confirmCheckout() {
        this.showToast(`结账成功！已消费 ${this.formatCurrency(this.consumedAmount)}，剩余 ${this.formatCurrency(this.remainingBalance)}`, 'success');
        this.hideModal('checkout-modal');
    }

    enterIdleMode() {
        this.showModal('idle-modal');
    }

    exitIdleMode() {
        this.hideModal('idle-modal');
    }

    callService() {
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
            this.showModal('recharge-modal');
        });

        document.getElementById('call-btn').addEventListener('click', () => {
            this.callService();
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
            this.isRunning = true;
            this.startTimer();
        });

        document.getElementById('cancel-checkout').addEventListener('click', () => {
            this.hideModal('checkout-modal');
            this.isRunning = true;
            this.startTimer();
        });

        document.getElementById('confirm-checkout').addEventListener('click', () => {
            this.confirmCheckout();
        });

        document.getElementById('exit-idle-btn').addEventListener('click', () => {
            this.exitIdleMode();
        });

        document.getElementById('recharge-modal').addEventListener('click', (e) => {
            if (e.target.id === 'recharge-modal') {
                this.hideModal('recharge-modal');
            }
        });

        document.getElementById('checkout-modal').addEventListener('click', (e) => {
            if (e.target.id === 'checkout-modal') {
                this.hideModal('checkout-modal');
                this.isRunning = true;
                this.startTimer();
            }
        });

        document.getElementById('custom-amount-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('custom-amount-btn').click();
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