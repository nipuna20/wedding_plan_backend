const packageFeatures = {
    BASIC: {
        canContact: false,
        googleMap: false,
        reviewAndRating: false,
        allowReviews: false,       // <-- NEW: Reviews not allowed on BASIC
        chatWithCustomer: false,
        faq: false,
        analytics: false,
        orderPayment: false,
        galleryUpload: false,
        socialLinks: false
    },
    STANDARD: {
        canContact: true,
        googleMap: true,
        reviewAndRating: true,
        allowReviews: true,        // <-- NEW: Reviews allowed on STANDARD
        chatWithCustomer: true,
        faq: true,
        analytics: true,
        orderPayment: 'long_settlement',
        galleryUpload: true,
        socialLinks: true
    },
    PREMIUM: {
        canContact: true,
        googleMap: true,
        reviewAndRating: true,
        allowReviews: true,        // <-- NEW: Reviews allowed on PREMIUM
        chatWithCustomer: true,
        faq: true,
        analytics: true,
        orderPayment: 'quick_settlement',
        galleryUpload: true,
        socialLinks: true,
        support24x7: true,
        freeAd: true
    }
};

module.exports = packageFeatures;
