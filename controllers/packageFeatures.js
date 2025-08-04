const packageFeatures = {
    BASIC: {
        canContact: false,
        googleMap: false,
        reviewAndRating: false,
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
