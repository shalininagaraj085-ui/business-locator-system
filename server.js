const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const fs = require("fs");

const Business = require("./businessmodel");
const User = require("./userModel");
const Review = require("./reviewmodel");
const Chat = require("./chatmodel");

require("dotenv").config();

const app = express();

/* =========================================
   MIDDLEWARE
========================================= */

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


/* =========================================
   FRONTEND
========================================= */

// server.js and index.html are in the same folder
app.use(express.static(__dirname));

app.get("/", function (req, res) {
    res.sendFile(path.join(__dirname, "index.html"));
});


/* =========================================
   MONGODB
========================================= */

const MONGODB_URI =
    process.env.MONGODB_URI ||
    "mongodb://127.0.0.1:27017/businesslocator";

mongoose
    .connect(MONGODB_URI)
    .then(function () {
        console.log("MongoDB Connected Successfully! ✅");
    })
    .catch(function (error) {
        console.error("MongoDB Connection Error:", error);
    });


/* =========================================
   IMAGE UPLOAD
========================================= */

const uploadFolder = path.join(
    __dirname,
    "images",
    "uploads"
);

if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder, {
        recursive: true
    });
}

app.use(
    "/images",
    express.static(
        path.join(__dirname, "images")
    )
);

const storage = multer.diskStorage({

    destination: function (req, file, cb) {
        cb(null, uploadFolder);
    },

    filename: function (req, file, cb) {

        const uniqueName =
            Date.now() +
            "-" +
            Math.round(Math.random() * 1000000000) +
            path.extname(file.originalname);

        cb(null, uniqueName);
    }

});

const upload = multer({

    storage: storage,

    fileFilter: function (req, file, cb) {

        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Only image files are allowed"));
        }

    },

    limits: {
        fileSize: 5 * 1024 * 1024
    }

});


/* =========================================
   HEALTH CHECK
========================================= */

app.get("/api/health", function (req, res) {

    res.json({
        message:
            "Business Locator Backend is Running Successfully! 🚀",

        status: "Online",

        database:
            mongoose.connection.readyState === 1
                ? "Connected"
                : "Disconnected"
    });

});


/* =========================================
   USER REGISTER
========================================= */

app.post("/api/users", async function (req, res) {

    try {

        const {
            name,
            email,
            password
        } = req.body;

        if (!name || !email || !password) {

            return res.status(400).json({
                message:
                    "Name, email and password are required"
            });

        }

        const existingUser =
            await User.findOne({
                email: email
            });

        if (existingUser) {

            return res.status(400).json({
                message:
                    "User already exists"
            });

        }

        const user = new User({
            name: name,
            email: email,
            password: password
        });

        await user.save();

        res.status(201).json({
            message:
                "Registration successful",

            user: user
        });

    } catch (error) {

        console.error(
            "Register Error:",
            error
        );

        res.status(500).json({
            message:
                "Error registering user",

            error:
                error.message
        });

    }

});


/* =========================================
   USER LOGIN
========================================= */

app.post(
    "/api/users/login",
    async function (req, res) {

        try {

            const {
                email,
                password
            } = req.body;

            if (!email || !password) {

                return res.status(400).json({
                    message:
                        "Email and password are required"
                });

            }

            const user =
                await User.findOne({
                    email: email,
                    password: password
                });

            if (!user) {

                return res.status(401).json({
                    message:
                        "Invalid email or password"
                });

            }

            res.json({
                message:
                    "Login successful",

                user:
                    user
            });

        } catch (error) {

            console.error(
                "Login Error:",
                error
            );

            res.status(500).json({
                message:
                    "Error logging in",

                error:
                    error.message
            });

        }

    }
);


/* =========================================
   ADD REVIEW
========================================= */

app.post(
    "/api/reviews",
    async function (req, res) {

        try {

            const {
                businessName,
                rating,
                review,
                email
            } = req.body;

            if (
                !businessName ||
                !rating ||
                !review
            ) {

                return res.status(400).json({
                    message:
                        "Business name, rating and review are required"
                });

            }

            const newReview =
                new Review({

                    businessName:
                        businessName,

                    rating:
                        rating,

                    review:
                        review,

                    email:
                        email || ""

                });

            await newReview.save();

            res.status(201).json({

                message:
                    "Review added successfully",

                review:
                    newReview

            });

        } catch (error) {

            console.error(
                "Review Error:",
                error
            );

            res.status(500).json({

                message:
                    "Error adding review",

                error:
                    error.message

            });

        }

    }
);


/* =========================================
   GET REVIEWS
========================================= */

app.get(
    "/api/reviews/:businessName",
    async function (req, res) {

        try {

            const businessName =
                req.params.businessName;

            const reviews =
                await Review.find({
                    businessName:
                        businessName
                }).sort({
                    createdAt:
                        -1
                });

            res.json(reviews);

        } catch (error) {

            console.error(
                "Get Reviews Error:",
                error
            );

            res.status(500).json({

                message:
                    "Error getting reviews",

                error:
                    error.message

            });

        }

    }
);


/* =========================================
   DELETE REVIEW
========================================= */

app.delete(
    "/api/reviews/:id",
    async function (req, res) {

        try {

            const deletedReview =
                await Review.findByIdAndDelete(
                    req.params.id
                );

            if (!deletedReview) {

                return res.status(404).json({
                    message:
                        "Review not found"
                });

            }

            res.json({

                message:
                    "Review deleted successfully",

                review:
                    deletedReview

            });

        } catch (error) {

            console.error(
                "Delete Review Error:",
                error
            );

            res.status(500).json({

                message:
                    "Error deleting review",

                error:
                    error.message

            });

        }

    }
);


/* =========================================
   GET ALL BUSINESSES
========================================= */

app.get(
    "/api/businesses",
    async function (req, res) {

        try {

            const businesses =
                await Business.find();

            res.json(businesses);

        } catch (error) {

            console.error(
                "Get Businesses Error:",
                error
            );

            res.status(500).json({

                message:
                    "Error getting businesses",

                error:
                    error.message

            });

        }

    }
);


/* =========================================
   GET SINGLE BUSINESS
========================================= */

app.get(
    "/api/businesses/:id",
    async function (req, res) {

        try {

            const business =
                await Business.findById(
                    req.params.id
                );

            if (!business) {

                return res.status(404).json({
                    message:
                        "Business not found"
                });

            }

            res.json(business);

        } catch (error) {

            console.error(
                "Get Business Error:",
                error
            );

            res.status(500).json({

                message:
                    "Error getting business",

                error:
                    error.message

            });

        }

    }
);


/* =========================================
   ADD BUSINESS
========================================= */

app.post(
    "/api/businesses",
    upload.single("image"),
    async function (req, res) {

        try {

            const {
                name,
                category,
                location,
                phone
            } = req.body;

            if (
                !name ||
                !category ||
                !location ||
                !phone
            ) {

                return res.status(400).json({

                    message:
                        "All business details are required"

                });

            }

            let imagePath = "";

            if (req.file) {

                imagePath =
                    "/images/uploads/" +
                    req.file.filename;

            }

            const business =
                new Business({

                    name:
                        name,

                    category:
                        category,

                    location:
                        location,

                    phone:
                        phone,

                    image:
                        imagePath

                });

            await business.save();

            res.status(201).json({

                message:
                    "Business added successfully",

                business:
                    business

            });

        } catch (error) {

            console.error(
                "Add Business Error:",
                error
            );

            res.status(500).json({

                message:
                    "Error adding business",

                error:
                    error.message

            });

        }

    }
);


/* =========================================
   UPDATE BUSINESS
========================================= */

app.put(
    "/api/businesses/:id",
    upload.single("image"),
    async function (req, res) {

        try {

            const {
                name,
                category,
                location,
                phone
            } = req.body;

            const updateData = {

                name:
                    name,

                category:
                    category,

                location:
                    location,

                phone:
                    phone

            };

            if (req.file) {

                updateData.image =
                    "/images/uploads/" +
                    req.file.filename;

            }

            const business =
                await Business.findByIdAndUpdate(

                    req.params.id,

                    updateData,

                    {
                        new: true,
                        runValidators: true
                    }

                );

            if (!business) {

                return res.status(404).json({

                    message:
                        "Business not found"

                });

            }

            res.json({

                message:
                    "Business updated successfully",

                business:
                    business

            });

        } catch (error) {

            console.error(
                "Update Business Error:",
                error
            );

            res.status(500).json({

                message:
                    "Error updating business",

                error:
                    error.message

            });

        }

    }
);


/* =========================================
   DELETE BUSINESS
========================================= */

app.delete(
    "/api/businesses/:id",
    async function (req, res) {

        try {

            const business =
                await Business.findByIdAndDelete(
                    req.params.id
                );

            if (!business) {

                return res.status(404).json({

                    message:
                        "Business not found"

                });

            }

            res.json({

                message:
                    "Business deleted successfully",

                business:
                    business

            });

        } catch (error) {

            console.error(
                "Delete Business Error:",
                error
            );

            res.status(500).json({

                message:
                    "Error deleting business",

                error:
                    error.message

            });

        }

    }
);
/* =========================================
   LIVE CHAT
========================================= */

// GET chat messages for a business
app.get("/api/chats/:businessName", async function (req, res) {
    try {

        const chats = await Chat.find({
            businessName: req.params.businessName
        }).sort({
            createdAt: 1
        });

        res.json(chats);

    } catch (error) {

        console.error("Chat fetch error:", error);

        res.status(500).json({
            message: "Failed to fetch chat messages"
        });

    }
});


// SEND chat message
app.post("/api/chats", async function (req, res) {
    try {

        const {
            userName,
            businessName,
            message,
            sender
        } = req.body;

        if (!userName || !businessName || !message) {

            return res.status(400).json({
                message: "All fields are required"
            });

        }

        const newChat = new Chat({

            userName: userName,

            businessName: businessName,

            message: message,

            sender: sender || "user"

        });

        await newChat.save();

        res.status(201).json(newChat);

    } catch (error) {

        console.error("Chat send error:", error);

        res.status(500).json({
            message: "Failed to send message"
        });

    }
});

/* =========================================
   MULTER / GENERAL ERROR HANDLER
========================================= */

app.use(function (error, req, res, next) {

    if (error instanceof multer.MulterError) {

        return res.status(400).json({

            message:
                "Image upload error",

            error:
                error.message

        });

    }

    if (error) {

        return res.status(400).json({

            message:
                error.message

        });

    }

    next();

});


/* =========================================
   START SERVER
========================================= */

const PORT =
    process.env.PORT || 5000;

app.listen(
    PORT,
    "0.0.0.0",
    function () {
        console.log(
            `Business Locator Backend running on port ${PORT}`
        );
    }
);
