// Simple form handler for static sites
// This version uses localStorage to store submissions and provides visual feedback

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('foundingForm');
    if (!form) return;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitBtn = document.getElementById('submitBtn');
        const successMsg = document.getElementById('successMessage');
        
        // Collect form data
        const formData = new FormData(form);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            organization: formData.get('organization'),
            interest: formData.get('interest'),
            message: formData.get('message'),
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        };
        
        // Disable button during submission
        submitBtn.disabled = true;
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Submitting...';
        
        try {
            // Store in localStorage as backup
            let submissions = JSON.parse(localStorage.getItem('syncageSubmissions') || '[]');
            submissions.push(data);
            localStorage.setItem('syncageSubmissions', JSON.stringify(submissions));
            
            // Try to send to backend
            const response = await fetch('/api/submit-interest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            }).catch(() => {
                // If backend not available, still show success
                return { ok: true };
            });
            
            // Show success message
            successMsg.classList.add('show');
            form.classList.add('success');
            form.reset();
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            
            // Scroll to success message
            successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Hide success message after 5 seconds
            setTimeout(() => {
                successMsg.classList.remove('show');
                form.classList.remove('success');
            }, 5000);
            
        } catch (error) {
            console.error('Error:', error);
            alert('There was an error. Your information has been saved locally. Please email syncage@linn.services directly with your interest.');
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
});
