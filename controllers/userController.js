const User = require('../models/User');
const mongoose = require('mongoose');

// GET /api/user/profile
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ user });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// PUT /api/user/update-profile
const updateUserProfile = async (req, res) => {
    try {
        const { name, email, phone } = req.body;
        const updates = {};
        
        if (name) updates.name = name;
        if (email) updates.email = email;
        if (phone) updates.phone = phone;
        
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updates },
            { new: true, runValidators: true }
        ).select('-password');
        
        res.status(200).json({ message: 'Profile updated successfully', user });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update vendor profile
const updateVendorSetup = async (req, res) => {
    try {
        const { name, businessName, address, socialLinks } = req.body;
        
        if (req.user.role !== 'vendor') {
            return res.status(403).json({ message: 'Only vendors can update business details' });
        }
        
        const updates = {};
        if (name) updates.name = name;
        if (businessName) updates.businessName = businessName;
        if (address) updates.address = address;
        if (socialLinks) updates.socialLinks = socialLinks;
        
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updates },
            { new: true } 
        ).select('-password');
        
        res.status(200).json({ message: 'Vendor profile updated successfully', user });
    } catch (error) {
        console.error('Update vendor setup error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update unavailable dates for vendor
const updateVendorAvailability = async (req, res) => {
    try {
        const { unavailableDates } = req.body;
        
        if (req.user.role !== 'vendor') {
            return res.status(403).json({ message: 'Only vendors can update availability' });
        }
        
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { unavailableDates },
            { new: true }
        ).select('-password');
        
        res.status(200).json({ 
            message: 'Availability updated successfully', 
            unavailableDates: user.unavailableDates 
        });
    } catch (error) {
        console.error('Update availability error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Add service details
const addServiceDetails = async (req, res) => {
    try {
        const userId = req.user._id;
        const {
            serviceName,
            serviceType,
            description,
            paymentPolicy,
            mediaUrls = [],
        } = req.body;

        const user = await User.findById(userId);

        if (!user || user.role !== 'vendor') {
            return res.status(403).json({ message: 'Only vendors can add services' });
        }

        const newService = {
            serviceName,
            serviceType,
            description,
            paymentPolicy,
            mediaUrls,
            averageRating: 0.0,
            reviewCount: 0,
            basePrice: 0.0,
        };
        
        user.serviceDetails.push(newService);
        await user.save();
        
        const serviceId = user.serviceDetails[user.serviceDetails.length - 1]._id;
        
        console.log('Created service with ID:', serviceId);
        
        res.status(200).json({
            _id: serviceId.toString(),
            serviceName,
            serviceType,
            description,
            paymentPolicy,
            mediaUrls,
            averageRating: 0.0,
            reviewCount: 0,
            basePrice: 0.0
        });
    } catch (error) {
        console.error('Add service error:', error);
        res.status(500).json({ message: 'Something went wrong' });
    }
};

// GET all services from all vendors
const getAllUserServices = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: 'Invalid or missing authentication token' });
        }
        
        const { serviceType } = req.query;
        console.log('Fetching services with serviceType:', serviceType, 'for user:', req.user._id);
        
        const services = [];
        
        if (req.user.role === 'vendor') {
            const user = await User.findById(req.user._id).select('serviceDetails businessName name phone');
            if (user && user.serviceDetails) {
                let vendorServices = user.serviceDetails;
                if (serviceType) {
                    vendorServices = vendorServices.filter(s => s.serviceType.toLowerCase() === serviceType.toLowerCase());
                }
                vendorServices.forEach(service => {
                    services.push({
                        _id: service._id.toString(),
                        serviceName: service.serviceName,
                        serviceType: service.serviceType,
                        description: service.description,
                        paymentPolicy: service.paymentPolicy,
                        mediaUrls: service.mediaUrls,
                        averageRating: service.averageRating || 0.0,
                        reviewCount: service.reviewCount || 0,
                        basePrice: service.basePrice || 0.0,
                        vendorId: user._id.toString(),
                        vendorName: user.businessName || user.name,
                        phone: user.phone || 'Not available',
                    });
                });
            }
        } else {
            const vendors = await User.find({ role: 'vendor' })
                .select('serviceDetails businessName name phone');
            vendors.forEach(vendor => {
                if (vendor.serviceDetails && vendor.serviceDetails.length > 0) {
                    let vendorServices = vendor.serviceDetails;
                    if (serviceType) {
                        vendorServices = vendorServices.filter(s => s.serviceType.toLowerCase() === serviceType.toLowerCase());
                    }
                    vendorServices.forEach(service => {
                        services.push({
                            _id: service._id.toString(),
                            serviceName: service.serviceName,
                            serviceType: service.serviceType,
                            description: service.description,
                            paymentPolicy: service.paymentPolicy,
                            mediaUrls: service.mediaUrls,
                            averageRating: service.averageRating || 0.0,
                            reviewCount: service.reviewCount || 0,
                            basePrice: service.basePrice || 0.0,
                            vendorId: vendor._id.toString(),
                            vendorName: vendor.businessName || vendor.name,
                            phone: vendor.phone || 'Not available',
                        });
                    });
                }
            });
        }
        
        res.status(200).json({ services });
    } catch (error) {
        console.error('Get all services error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteService = async (req, res) => {
    try {
        const serviceId = req.params.serviceId;
        const user = await User.findById(req.user._id);
        
        if (!user || user.role !== 'vendor') {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        
        const serviceIndex = user.serviceDetails.findIndex(
            service => service._id.toString() === serviceId
        );
        
        if (serviceIndex === -1) {
            return res.status(404).json({ message: 'Service not found' });
        }
        
        user.serviceDetails.splice(serviceIndex, 1);
        await user.save();
        
        res.status(200).json({ message: 'Service deleted successfully' });
    } catch (error) {
        console.error('Delete service error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateServiceDetails = async (req, res) => {
    try {
        const serviceId = req.params.serviceId;
        const updates = req.body;
        const user = await User.findById(req.user._id);
        
        if (!user || user.role !== 'vendor') {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        
        const service = user.serviceDetails.id(serviceId);
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }
        
        if (updates.serviceName) service.serviceName = updates.serviceName;
        if (updates.serviceType) service.serviceType = updates.serviceType;
        if (updates.description) service.description = updates.description;
        if (updates.paymentPolicy) service.paymentPolicy = updates.paymentPolicy;
        if (updates.mediaUrls) service.mediaUrls = updates.mediaUrls;
        
        await user.save();
        
        res.status(200).json({ message: 'Service updated successfully', service });
    } catch (error) {
        console.error('Update service error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getServiceById = async (req, res) => {
    try {
        const serviceId = req.params.serviceId;
        const user = await User.findById(req.user._id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const service = user.serviceDetails.id(serviceId);
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }
        
        res.status(200).json(service);
    } catch (error) {
        console.error('Get service by ID error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const addPackage = async (req, res) => {
    try {
        const userId = req.user._id;
        const { packageName, packagePrice, description, serviceId } = req.body;
        
        const user = await User.findById(userId);
        
        if (!user || user.role !== 'vendor') {
            return res.status(403).json({ message: 'Only vendors can add packages' });
        }
        
        if (!serviceId) {
            return res.status(400).json({ message: 'Service ID is required' });
        }
        
        const serviceExists = user.serviceDetails.some(s => s._id.toString() === serviceId);
        if (!serviceExists) {
            return res.status(404).json({ message: 'Service not found' });
        }
        
        const newPackage = {
            packageName,
            packagePrice: parseFloat(packagePrice),
            description,
            serviceId: mongoose.Types.ObjectId(serviceId)
        };
        
        user.packages.push(newPackage);
        await user.save();
        
        res.status(201).json({ 
            message: 'Package added successfully',
            package: newPackage
        });
    } catch (error) {
        console.error('Add package error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get all packages
const getAllPackages = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        if (!user) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        if (user.role === 'vendor') {
            // Vendors get their own packages
            return res.status(200).json({ packages: user.packages });
        } else if (user.role === 'customer') {
            // Customers get all packages from all vendors
            const vendors = await User.find({ role: 'vendor' }).select('packages businessName name');
            const allPackages = vendors.flatMap(vendor => 
                vendor.packages.map(pkg => ({
                    ...pkg.toObject(),
                    vendorId: vendor._id.toString(),
                    vendorName: vendor.businessName || vendor.name
                }))
            );
            return res.status(200).json({ packages: allPackages });
        } else {
            return res.status(403).json({ message: 'Unauthorized' });
        }
    } catch (error) {
        console.error('Get packages error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getPackageById = async (req, res) => {
    try {
        const packageId = req.params.packageId;
        const user = await User.findById(req.user._id);
        
        if (!user || user.role !== 'vendor') {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        
        const package = user.packages.id(packageId);
        if (!package) {
            return res.status(404).json({ message: 'Package not found' });
        }
        
        res.status(200).json(package);
    } catch (error) {
        console.error('Get package by ID error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const deletePackage = async (req, res) => {
    try {
        const packageId = req.params.packageId;
        const user = await User.findById(req.user._id);
        
        if (!user || user.role !== 'vendor') {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        
        const packageIndex = user.packages.findIndex(
            pkg => pkg._id.toString() === packageId
        );
        
        if (packageIndex === -1) {
            return res.status(404).json({ message: 'Package not found' });
        }
        
        user.packages.splice(packageIndex, 1);
        await user.save();
        
        res.status(200).json({ message: 'Package deleted successfully' });
    } catch (error) {
        console.error('Delete package error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const updatePackage = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            console.log('User not found!');
            return res.status(404).json({ message: 'User not found' });
        }
        if (user.role !== 'vendor') {
            console.log('User is not a vendor!');
            return res.status(403).json({ message: 'Unauthorized' });
        }
        const packageId = req.params.packageId;
        
        const packageToUpdate = user.packages.id(packageId);
        if (!packageToUpdate) {
            console.log('Package not found!');
            return res.status(404).json({ message: 'Package not found' });
        }
        const { packageName, packagePrice, description } = req.body;
        if (packageName) packageToUpdate.packageName = packageName;
        if (packagePrice) packageToUpdate.packagePrice = parseFloat(packagePrice);
        if (description) packageToUpdate.description = description;
        await user.save();
        res.status(200).json({ message: 'Package updated successfully', package: packageToUpdate });
    } catch (error) {
        console.error('Error during package update:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const addPackagesToService = async (req, res) => {
    try {
        const { serviceId } = req.params;
        const { packages } = req.body;
        
        console.log('Adding packages to service:', serviceId);
        console.log('Packages data:', packages);
        
        if (!serviceId) {
            return res.status(400).json({ message: 'Service ID is required' });
        }
        
        if (!packages || !Array.isArray(packages)) {
            return res.status(400).json({ message: 'Invalid packages data' });
        }
        
        const user = await User.findById(req.user._id);
        if (!user || user.role !== 'vendor') {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        
        const serviceExists = user.serviceDetails.some(s => s._id.toString() === serviceId);
        if (!serviceExists) {
            return res.status(404).json({ message: 'Service not found' });
        }
        
        const addedPackages = [];
        for (const packageData of packages) {
            // Accept price as string and convert to number
            if (typeof packageData.price === 'string') {
                const parsedPrice = parseFloat(packageData.price);
                if (isNaN(parsedPrice)) {
                    return res.status(400).json({ message: `Invalid price format for package: ${packageData.name}` });
                }
                packageData.price = parsedPrice; // Convert to number
            } else if (typeof packageData.price !== 'number' || isNaN(packageData.price)) {
                return res.status(400).json({ message: `Invalid price format for package: ${packageData.name}` });
            }
            const newPackage = {
                packageName: packageData.name,
                packagePrice: packageData.price,
                description: packageData.description,
                serviceId: new mongoose.Types.ObjectId(serviceId)
            };
            user.packages.push(newPackage);
            addedPackages.push(newPackage);
        }
        
        await user.save();
        res.status(200).json({ 
            success: true, 
            message: 'Packages added successfully', 
            packages: addedPackages 
        });
    } catch (error) {
        console.error('Add packages to service error:', error);
        if (error.name === 'ValidationError' || error.name === 'CastError') {
            console.error('MongoDB validation/cast error details:', error.message);
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const addMainTask = async (req, res) => {
    try {
        const { name, timeline, deadline } = req.body;
        
        if (req.user.role !== 'customer') {
            return res.status(403).json({ message: 'Only customers can add tasks' });
        }
        
        const user = await User.findById(req.user._id);
        
        const newTask = {
            name,
            timeline,
            deadline: new Date(deadline),
            subtasks: []
        };
        
        user.tasks.push(newTask);
        await user.save();
        
        res.status(201).json({ message: 'Task added successfully', task: newTask });
    } catch (error) {
        console.error('Add task error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getTasks = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        if (req.user.role !== 'customer') {
            return res.status(403).json({ message: 'Only customers can view tasks' });
        }
        
        res.status(200).json({ tasks: user.tasks });
    } catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const addSubtask = async (req, res) => {
    try {
        const { taskIndex } = req.params;
        const { title } = req.body;
        
        if (req.user.role !== 'customer') {
            return res.status(403).json({ message: 'Only customers can add subtasks' });
        }
        
        const user = await User.findById(req.user._id);
        
        if (!user.tasks[taskIndex]) {
            return res.status(404).json({ message: 'Task not found' });
        }
        
        const newSubtask = {
            title,
            completed: false
        };
        
        user.tasks[taskIndex].subtasks.push(newSubtask);
        await user.save();
        
        res.status(201).json({ 
            message: 'Subtask added successfully', 
            subtask: newSubtask 
        });
    } catch (error) {
        console.error('Add subtask error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getSubtasks = async (req, res) => {
    try {
        const { index } = req.params;
        const user = await User.findById(req.user._id);
        
        if (req.user.role !== 'customer') {
            return res.status(403).json({ message: 'Only customers can view subtasks' });
        }
        
        if (!user.tasks[index]) {
            return res.status(404).json({ message: 'Task not found' });
        }
        
        res.status(200).json({ subtasks: user.tasks[index].subtasks });
    } catch (error) {
        console.error('Get subtasks error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteSubtask = async (req, res) => {
    try {
        const { taskIndex, subtaskIndex } = req.params;
        const user = await User.findById(req.user._id);
        
        if (req.user.role !== 'customer') {
            return res.status(403).json({ message: 'Only customers can delete subtasks' });
        }
        
        if (!user.tasks[taskIndex]) {
            return res.status(404).json({ message: 'Task not found' });
        }
        
        if (!user.tasks[taskIndex].subtasks[subtaskIndex]) {
            return res.status(404).json({ message: 'Subtask not found' });
        }
        
        user.tasks[taskIndex].subtasks.splice(subtaskIndex, 1);
        await user.save();
        
        res.status(200).json({ message: 'Subtask deleted successfully' });
    } catch (error) {
        console.error('Delete subtask error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteTask = async (req, res) => {
    try {
        const { taskIndex } = req.params;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (req.user.role !== 'customer') {
            return res.status(403).json({ message: 'Only customers can delete tasks' });
        }

        if (!user.tasks[taskIndex]) {
            return res.status(404).json({ message: 'Task not found' });
        }

        user.tasks.splice(taskIndex, 1);
        await user.save();

        res.status(200).json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    deleteService,
    updateServiceDetails,
    getServiceById,
    getAllPackages,
    getPackageById,
    deletePackage,
    updatePackage, 
    getUserProfile, 
    updateUserProfile, 
    updateVendorSetup, 
    updateVendorAvailability, 
    addServiceDetails, 
    getAllUserServices, 
    addPackage, 
    addSubtask, 
    addMainTask, 
    getTasks, 
    getSubtasks, 
    deleteSubtask,
    addPackagesToService,
    deleteTask
};