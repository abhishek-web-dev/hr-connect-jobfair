/**
 * CareerConnect - Upgraded HR Recruitment Portal JS Logic
 * 
 * This file handles:
 * 1. Mobile Sticky CTA Visibility on Scroll (Dual buttons)
 * 2. Dynamic Experience Fields (Toggles details based on experience level)
 * 3. Drag-and-Drop Resume File Upload (Translates file to Base64)
 * 4. Client-side Form Validation
 * 5. Google Apps Script Web App Integration (Avoids CORS preflight OPTIONS request)
 * 6. Success Modal and automatic 3-second WhatsApp redirection countdown
 */

// Google Apps Script Web App Endpoint Placeholder
// REPLACE this string with your actual Google Apps Script Web App URL after deployment.
const SCRIPT_URL = "https://docs.google.com/spreadsheets/d/1jqRImi6XHPrldUmR_V3jTB5rXeaxlKZc2lw3JQv-Yv0/edit?gid=0#gid=0";

document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const form = document.getElementById("student-registration-form");
    const submitBtn = document.getElementById("submit-btn");
    const submitBtnText = submitBtn.querySelector(".btn-text");
    const spinner = submitBtn.querySelector(".spinner");
    const experienceSelect = document.getElementById("experience");
    const experienceDetailsGroup = document.getElementById("experience-details-group");
    const experienceDetailsTextarea = document.getElementById("experienceDetails");
    const errorBanner = document.getElementById("form-error-banner");
    const errorBannerText = document.getElementById("form-error-text");

    // Resume File Upload Elements
    const fileUploadZone = document.getElementById("file-upload-zone");
    const resumeInput = document.getElementById("resume-input");
    const uploadFilename = document.getElementById("upload-filename");
    const btnClearFile = document.getElementById("btn-clear-file");

    // Sticky CTA Elements
    const stickyCta = document.getElementById("sticky-cta-bar");
    const heroSection = document.querySelector(".hero-section");

    // Success Modal Elements
    const successModal = document.getElementById("success-modal");
    const closeModalBtn = document.getElementById("close-modal-btn");
    const countdownSpan = document.getElementById("countdown");

    // Redirection Variables
    const WHATSAPP_LINK = "https://chat.whatsapp.com/BLyykwxpRyRI0fzq9vUbkb?mode=gi_t";
    let redirectTimer = null;
    let countdownInterval = null;

    // File Data Variables
    let resumeBase64 = "";
    let resumeFileName = "";
    const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB Limit

    /* ==========================================================================
       1. Mobile Sticky CTA Visibility on Scroll
       ========================================================================== */
    const handleScroll = () => {
        if (!heroSection || !stickyCta) return;

        // Calculate when the user scrolls past the Hero Section
        const heroBottom = heroSection.offsetTop + heroSection.offsetHeight - 80;

        if (window.scrollY > heroBottom) {
            stickyCta.classList.add("show");
        } else {
            stickyCta.classList.remove("show");
        }
    };

    window.addEventListener("scroll", handleScroll);

    /* ==========================================================================
       2. Dynamic Experience Fields Handler
       ========================================================================== */
    const handleExperienceChange = () => {
        const value = experienceSelect.value;

        // Show experience details for values other than Fresher
        if (value && value !== "Fresher") {
            experienceDetailsGroup.style.display = "flex";
            experienceDetailsTextarea.setAttribute("required", "required");
            // Soft transition animation
            experienceDetailsGroup.style.opacity = 0;
            experienceDetailsGroup.style.transition = "opacity 0.3s ease";
            setTimeout(() => {
                experienceDetailsGroup.style.opacity = 1;
            }, 50);
        } else {
            experienceDetailsGroup.style.display = "none";
            experienceDetailsTextarea.removeAttribute("required");
            experienceDetailsTextarea.value = ""; // Clear values if hidden
        }
    };

    experienceSelect.addEventListener("change", handleExperienceChange);

    /* ==========================================================================
       3. Drag-and-Drop Resume File Upload (Base64 Translation)
       ========================================================================== */
    // Trigger input click when clicking on the upload zone
    fileUploadZone.addEventListener("click", (e) => {
        // Prevent click loop if we clicked clear button
        if (e.target.closest("#btn-clear-file")) return;
        resumeInput.click();
    });

    // Drag-over styling
    fileUploadZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        fileUploadZone.classList.add("dragover");
    });

    fileUploadZone.addEventListener("dragleave", () => {
        fileUploadZone.classList.remove("dragover");
    });

    fileUploadZone.addEventListener("drop", (e) => {
        e.preventDefault();
        fileUploadZone.classList.remove("dragover");

        if (e.dataTransfer.files.length > 0) {
            processFile(e.dataTransfer.files[0]);
        }
    });

    // Manual selection event
    resumeInput.addEventListener("change", () => {
        if (resumeInput.files.length > 0) {
            processFile(resumeInput.files[0]);
        }
    });

    // Process selected file
    const processFile = (file) => {
        // Clear any previous file errors
        clearError("resume-input");

        // Validate file type
        const allowedExtensions = /(\.pdf|\.doc|\.docx)$/i;
        if (!allowedExtensions.exec(file.name)) {
            setError("resume-input", "Invalid file type. Only PDF and Doc formats are allowed.");
            clearFileState();
            return;
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            setError("resume-input", "File is too large. Maximum size allowed is 2MB.");
            clearFileState();
            return;
        }

        // Read file contents as Base64 Data URL
        const reader = new FileReader();
        reader.onload = (e) => {
            resumeBase64 = e.target.result;
            resumeFileName = file.name;

            // Update UI state
            fileUploadZone.classList.add("has-file");
            uploadFilename.textContent = file.name;
            btnClearFile.style.display = "flex";
        };
        reader.onerror = () => {
            setError("resume-input", "Error reading file. Please try selecting it again.");
            clearFileState();
        };
        reader.readAsDataURL(file);
    };

    // Reset upload elements
    const clearFileState = () => {
        resumeInput.value = "";
        resumeBase64 = "";
        resumeFileName = "";
        fileUploadZone.classList.remove("has-file");
        uploadFilename.textContent = "";
        btnClearFile.style.display = "none";
    };

    btnClearFile.addEventListener("click", (e) => {
        e.stopPropagation();
        clearFileState();
        clearError("resume-input");
    });

    /* ==========================================================================
       4. Form Validation Helpers
       ========================================================================== */
    const setError = (elementId, message) => {
        const element = document.getElementById(elementId);
        if (!element) return;
        const group = element.closest(".form-group");
        const errorSpan = document.getElementById(`error-${elementId}`);

        if (group && errorSpan) {
            group.classList.add("has-error");
            errorSpan.textContent = message;
            errorSpan.style.display = "flex";
        }
    };

    const clearError = (elementId) => {
        const element = document.getElementById(elementId);
        if (!element) return;
        const group = element.closest(".form-group");
        const errorSpan = document.getElementById(`error-${elementId}`);

        if (group && errorSpan) {
            group.classList.remove("has-error");
            errorSpan.textContent = "";
            errorSpan.style.display = "none";
        }
    };

    const validateForm = () => {
        let isValid = true;

        // Retrieve input elements
        const fullName = document.getElementById("fullName");
        const mobile = document.getElementById("mobile");
        const email = document.getElementById("email");
        const qualification = document.getElementById("qualification");
        const collegeName = document.getElementById("collegeName");
        const branch = document.getElementById("branch");
        const semester = document.getElementById("semester");
        const graduationYear = document.getElementById("graduationYear");
        const interestedRole = document.getElementById("interestedRole");
        const experience = document.getElementById("experience");

        // 1. Full Name Validation
        if (!fullName.value.trim()) {
            setError("fullName", "Full Name is required.");
            isValid = false;
        } else if (fullName.value.trim().length < 2) {
            setError("fullName", "Name must be at least 2 characters.");
            isValid = false;
        } else {
            clearError("fullName");
        }

        // 2. Mobile Validation (10 digit check)
        const mobilePattern = /^[6-9]\d{9}$/;
        const rawMobile = mobile.value.trim().replace(/[-\s]/g, "");
        if (!rawMobile) {
            setError("mobile", "Mobile number is required.");
            isValid = false;
        } else if (!mobilePattern.test(rawMobile)) {
            setError("mobile", "Enter a valid 10-digit mobile number.");
            isValid = false;
        } else {
            clearError("mobile");
        }

        // 3. Email Validation
        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!email.value.trim()) {
            setError("email", "Email address is required.");
            isValid = false;
        } else if (!emailPattern.test(email.value.trim())) {
            setError("email", "Enter a valid email address.");
            isValid = false;
        } else {
            clearError("email");
        }

        // 4. Qualification Validation
        if (!qualification.value.trim()) {
            setError("qualification", "Qualification is required.");
            isValid = false;
        } else {
            clearError("qualification");
        }

        // 5. College Name Validation
        if (!collegeName.value.trim()) {
            setError("collegeName", "College name is required.");
            isValid = false;
        } else {
            clearError("collegeName");
        }

        // 6. Branch / Stream Validation
        if (!branch.value.trim()) {
            setError("branch", "Branch or stream is required.");
            isValid = false;
        } else {
            clearError("branch");
        }

        // 7. Semester Validation
        if (!semester.value) {
            setError("semester", "Current Semester selection is required.");
            isValid = false;
        } else {
            clearError("semester");
        }

        // 8. Graduation Year Validation
        const yearVal = parseInt(graduationYear.value.trim(), 10);
        if (!graduationYear.value.trim()) {
            setError("graduationYear", "Graduation Year is required.");
            isValid = false;
        } else if (isNaN(yearVal) || yearVal < 2000 || yearVal > 2035) {
            setError("graduationYear", "Enter a valid graduation year (2000 - 2035).");
            isValid = false;
        } else {
            clearError("graduationYear");
        }

        // 9. Interested Role Validation
        if (!interestedRole.value) {
            setError("interestedRole", "Preferred interested role is required.");
            isValid = false;
        } else {
            clearError("interestedRole");
        }

        // 10. Experience Level Validation
        if (!experience.value) {
            setError("experience", "Experience status is required.");
            isValid = false;
        } else {
            clearError("experience");
        }

        return isValid;
    };

    /* ==========================================================================
       5. Form Submissions Logic (Google Apps Script Web App Integration)
       ========================================================================== */
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Hide previous error banners
        errorBanner.style.display = "none";

        // Run validations
        if (!validateForm()) {
            // Find first element with error and scroll to it
            const firstError = document.querySelector(".form-group.has-error");
            if (firstError) {
                firstError.scrollIntoView({ behavior: "smooth", block: "center" });
            }
            return;
        }


        // Enable Loading States
        setLoadingState(true);

        try {
            // Convert Form Data to URLSearchParams to avoid CORS preflight options
            const formData = new FormData(form);
            const urlEncoded = new URLSearchParams(formData);

            // Append Base64 File upload parameters to the URL-encoded payload
            if (resumeBase64 && resumeFileName) {
                urlEncoded.append("resumeFile", resumeBase64);
                urlEncoded.append("resumeName", resumeFileName);
            }

            const response = await fetch(SCRIPT_URL, {
                method: "POST",
                mode: "no-cors", // Google Apps Script redirects requires no-cors configuration
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: urlEncoded.toString()
            });

            // For 'no-cors' request mode, browser returns opaque status 0 on successful POST
            setLoadingState(false);
            showSuccessPopup();
            form.reset();
            clearFileState();
            handleExperienceChange();

        } catch (error) {
            console.error("Submission Error Details:", error);
            setLoadingState(false);

            // Show error banner to user
            errorBannerText.textContent = "Unable to connect with the server. Please check your internet connection or try again later.";
            errorBanner.style.display = "flex";
            errorBanner.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    });

    // Helper: Toggle submit button loading states
    const setLoadingState = (isLoading) => {
        if (isLoading) {
            submitBtn.setAttribute("disabled", "disabled");
            submitBtnText.style.opacity = 0;
            spinner.style.display = "inline-block";
        } else {
            submitBtn.removeAttribute("disabled");
            submitBtnText.style.opacity = 1;
            spinner.style.display = "none";
        }
    };

    /* ==========================================================================
       6. Success Modal Functions & 3-Second Countdown Redirection
       ========================================================================== */
    const showSuccessPopup = () => {
        successModal.classList.add("active");
        successModal.style.display = "flex";
        document.body.style.overflow = "hidden"; // Disable body scrolling

        // Start 3-second countdown and redirect to WhatsApp Group
        let countdownValue = 3;
        countdownSpan.textContent = countdownValue;

        countdownInterval = setInterval(() => {
            countdownValue -= 1;
            countdownSpan.textContent = countdownValue;
            if (countdownValue <= 0) {
                clearInterval(countdownInterval);
            }
        }, 1000);

        redirectTimer = setTimeout(() => {
            window.open(WHATSAPP_LINK, "_blank");
        }, 3000);
    };

    const hideSuccessPopup = () => {
        successModal.classList.remove("active");
        successModal.style.display = "none";
        document.body.style.overflow = ""; // Re-enable body scrolling

        // Clear timers to prevent redirects if closed early
        if (redirectTimer) clearTimeout(redirectTimer);
        if (countdownInterval) clearInterval(countdownInterval);
    };

    closeModalBtn.addEventListener("click", hideSuccessPopup);

    // Close modal if user clicks on the overlay background
    successModal.addEventListener("click", (e) => {
        if (e.target === successModal) {
            hideSuccessPopup();
        }
    });
});
