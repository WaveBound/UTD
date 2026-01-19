
// ============================================================================
// FEEDBACK.JS - Handling Suggestions & Bug Reports
// ============================================================================

const WORKER_URL = "https://suggestion-bugreport.wavebound.workers.dev"; // User to replace this

const openFeedbackModal = () => {
    toggleModal('feedbackModal', true);
    // Reset form
    document.getElementById('feedbackType').value = 'suggestion';
    document.getElementById('feedbackText').value = '';
    document.getElementById('feedbackStatus').innerHTML = '';
    document.getElementById('feedbackSendBtn').disabled = false;
};

async function sendFeedback() {
    const type = document.getElementById('feedbackType').value;
    const message = document.getElementById('feedbackText').value.trim();
    const statusEl = document.getElementById('feedbackStatus');
    const btn = document.getElementById('feedbackSendBtn');

    if (!message) {
        statusEl.innerHTML = '<span class="text-error">Please enter a message.</span>';
        return;
    }

    btn.disabled = true;
    statusEl.innerHTML = '<span class="text-gold">Sending...</span>';

    try {
        const response = await fetch(WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: type,
                message: message,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent
            })
        });

        if (response.ok) {
            statusEl.innerHTML = '<span class="text-success">Sent successfully! Thank you.</span>';
            setTimeout(() => closeModal('feedbackModal'), 2000);
        } else {
            throw new Error('Server error');
        }
    } catch (e) {
        console.error(e);
        statusEl.innerHTML = '<span class="text-error">Failed to send. Please try again.</span>';
        btn.disabled = false;
    }
}
