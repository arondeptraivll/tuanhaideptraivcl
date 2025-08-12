(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        REQUIRED_TIME: 50000, // 50 seconds
        REQUIRED_STEPS: 3,
        TARGET_LINK: 'https://link4m.com/qTDXbp8',
        STORAGE_KEY: 'ddos_download_session'
    };

    // Elements
    const stepSection = document.getElementById('stepSection');
    const successSection = document.getElementById('successSection');
    const stepText = document.getElementById('stepText');
    const stepIcon = document.getElementById('stepIcon');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const actionBtn = document.getElementById('actionBtn');

    // Icons for different steps
    const STEP_ICONS = {
        0: 'fas fa-play',
        1: 'fas fa-key',
        2: 'fas fa-lock-open',
        3: 'fas fa-gift'
    };

    const STEP_MESSAGES = {
        0: 'Sẵn sàng bắt đầu',
        1: 'Hoàn thành bước đầu tiên',
        2: 'Đã qua nửa chặng đường',
        3: 'Sắp hoàn thành'
    };

    // Session management
    function getSession() {
        try {
            const stored = localStorage.getItem(CONFIG.STORAGE_KEY);
            return stored ? JSON.parse(stored) : null;
        } catch (e) {
            return null;
        }
    }

    function saveSession(data) {
        try {
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error('Cannot save session');
        }
    }

    function createNewSession() {
        const session = {
            startTime: Date.now(),
            currentStep: 0,
            userIP: null,
            completedSteps: []
        };
        saveSession(session);
        return session;
    }

    // Validation functions
    function isValidReferrer() {
        const referrer = document.referrer;
        return referrer && referrer.includes('link4m.com');
    }

    function isTimeValid(session) {
        const timePassed = Date.now() - session.startTime;
        return timePassed >= CONFIG.REQUIRED_TIME;
    }

    function showBypassAlert() {
        Swal.fire({
            icon: 'error',
            title: 'Khó nha bro!',
            text: 'Dùng bypass thì tôi có tiền đâu mà húp :v',
            confirmButtonText: 'OK',
            confirmButtonColor: '#ff6b6b',
            background: '#111',
            color: '#fff'
        });
    }

    // UI Updates
    function updateProgress(step) {
        const percentage = (step / CONFIG.REQUIRED_STEPS) * 100;
        progressFill.style.width = percentage + '%';
        stepText.textContent = `Bước ${step}/${CONFIG.REQUIRED_STEPS}`;
        progressText.textContent = STEP_MESSAGES[step] || `Bước ${step} hoàn thành`;
        
        // Update icon
        stepIcon.className = STEP_ICONS[step] || 'fas fa-cog';
        
        if (step < CONFIG.REQUIRED_STEPS) {
            actionBtn.innerHTML = `<i class="fas fa-rocket"></i> Bắt đầu bước ${step + 1}`;
            actionBtn.href = CONFIG.TARGET_LINK;
        }
    }

    function showSuccess() {
        stepSection.style.display = 'none';
        successSection.style.display = 'block';
        
        // Clear session after success
        localStorage.removeItem(CONFIG.STORAGE_KEY);
    }

    // Main logic
    function handlePageLoad() {
        let session = getSession();
        const referrer = document.referrer;

        // First visit - create session
        if (!session) {
            session = createNewSession();
            updateProgress(0);
            return;
        }

        // Check if coming from target link
        if (isValidReferrer()) {
            // Validate time requirement
            if (!isTimeValid(session)) {
                showBypassAlert();
                return;
            }

            // Valid step completion
            session.currentStep++;
            session.completedSteps.push({
                step: session.currentStep,
                timestamp: Date.now(),
                referrer: referrer
            });

            if (session.currentStep >= CONFIG.REQUIRED_STEPS) {
                showSuccess();
                return;
            }

            // Update for next step
            saveSession(session);
            updateProgress(session.currentStep);

        } else if (session.currentStep > 0) {
            // Not coming from valid referrer but should be
            showBypassAlert();
            return;
        } else {
            // First step, update UI
            updateProgress(session.currentStep);
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', handlePageLoad);
    } else {
        handlePageLoad();
    }

    // Additional security: prevent common bypass attempts
    window.addEventListener('beforeunload', function() {
        const session = getSession();
        if (session) {
            session.lastActivity = Date.now();
            saveSession(session);
        }
    });

})();