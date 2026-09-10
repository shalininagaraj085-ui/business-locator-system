```js
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const fs = require("fs");

const Business = require("./businessmodel");
const User = require("./userModel");
const Review = require("./reviewmodel");

const app = express();

const PORT = process.env.PORT || 5000;


/* =========================================
   MIDDLEWARE
========================================= */

app.use(cors());

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);


/* =========================================
   SERVE FRONTEND FILES
========================================= */

// server.js is in project root
app.use(
    express.static(__dirname)
);


/* =========================================
   IMAGE UPLOAD SETUP
========================================= */

const uploadFolder = path.join(
    __dirname,
    "images",
    "uploads"
);


// Create upload folder automatically
if (!fs.existsSync(uploadFolder)) {

    fs.mkdirSync(
        uploadFolder,
        {
            recursive: true
        }
    );

}


/* =========================================
   SERVE UPLOADED IMAGES
========================================= */

app.use(
    "/images/uploads",
    express.static(uploadFolder)
);


/* =========================================
   MULTER STORAGE
========================================= */

const storage = multer.diskStorage({

    destination: function (
        req,
        file,
        cb
    ) {

        cb(
            null,
            uploadFolder
        );

    },

    filename: function (
        req,
        file,
        cb
    ) {

        const extension =
            path.extname(
                file.originalname
            );

        const fileName =
            Date.now() +
            "-" +
            Math.round(
                Math.random() * 100000
            ) +
            extension;

        cb(
            null,
            fileName
        );

    }

});


/* =========================================
   IMAGE FILE FILTER
========================================= */

const fileFilter = function (
    req,
    file,
    cb
) {

    const allowedTypes = [

        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/gif"

    ];


    if (
        allowedTypes.includes(
            file.mimetype
        )
    ) {

        cb(
            null,
            true
        );

    }

    else {

        cb(
            new Error(
                "Only image files are allowed"
            )
        );

    }

};


/* =========================================
   MULTER CONFIGURATION
========================================= */

const upload = multer({

    storage: storage,

    fileFilter: fileFilter,

    limits: {

        fileSize:
            5 * 1024 * 1024

    }

});


/* =========================================
   MONGODB CONNECTION
========================================= */

const MONGODB_URI =
    process.env.MONGODB_URI ||
    "mongodb://127.0.0.1:27017/businesslocator";


mongoose
    .connect(MONGODB_URI)

    .then(function () {

        console.log(
            "MongoDB Connected Successfully! ✅"
        );

    })

    .catch(function (error) {

        console.error(
            "MongoDB Connection Error:",
            error.message
        );

    });


/* =========================================
   HOME PAGE
========================================= */

app.get(
    "/",
    function (req, res) {

        res.sendFile(
            path.join(
                __dirname,
                "index.html"
            )
        );

    }
);


/* =========================================
   BACKEND HEALTH CHECK
========================================= */

app.get(
    "/api/health",
    function (req, res) {

        res.json({

            message:
                "Business Locator Backend is Running Successfully! 🚀",

            status:
                "Online",

            database:
                mongoose.connection.readyState === 1
                    ? "Connected"
                    : "Not Connected"

        });

    }
);


/* =========================================
   USER REGISTRATION
========================================= */

app.post(
    "/api/users",
    async function (req, res) {

        try {

            const {
                name,
                email,
                password
            } = req.body;


            if (
                !name ||
                !email ||
                !password
            ) {

                return res.status(400).json({

                    message:
                        "Name, email and password are required"

                });

            }


            const existingUser =
                await User.findOne({

                    email:
                        email

                });


            if (existingUser) {

                return res.status(409).json({

                    message:
                        "Email already registered"

                });

            }


            const user =
                new User({

                    name:
                        name,

                    email:
                        email,

                    password:
                        password

                });


            const savedUser =
                await user.save();


            res.status(201).json({

                message:
                    "User registered successfully",

                user:
                    savedUser

            });

        }

        catch (error) {

            console.error(
                "Registration Error:",
                error
            );


            res.status(500).json({

                message:
                    "Registration failed",

                error:
                    error.message

            });

        }

    }
);


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


            if (
                !email ||
                !password
            ) {

                return res.status(400).json({

                    message:
                        "Email and password are required"

                });

            }


            const user =
                await User.findOne({

                    email:
                        email

                });


            if (!user) {

                return res.status(401).json({

                    message:
                        "Invalid email or password"

                });

            }


            if (
                user.password !== password
            ) {

                return res.status(401).json({

                    message:
                        "Invalid email or password"

                });

            }


            res.json({

                message:
                    "Login successful",

                user: {

                    id:
                        user._id,

                    name:
                        user.name,

                    email:
                        user.email

                }

            });

        }

        catch (error) {

            console.error(
                "Login Error:",
                error
            );


            res.status(500).json({

                message:
                    "Login failed",

                error:
                    error.message

            });

        }

    }
);


/* =========================================
   ADD FAVORITE
========================================= */

app.post(
    "/api/favorites",
    async function (req, res) {

        try {

            const {
                email,
                businessName
            } = req.body;


            if (
                !email ||
                !businessName
            ) {

                return res.status(400).json({

                    message:
                        "Email and business name are required"

                });

            }


            const user =
                await User.findOne({

                    email:
                        email

                });


            if (!user) {

                return res.status(404).json({

                    message:
                        "User not found"

                });

            }


            if (
                !Array.isArray(
                    user.favorites
                )
            ) {

                user.favorites = [];

            }


            if (
                !user.favorites.includes(
                    businessName
                )
            ) {

                user.favorites.push(
                    businessName
                );

                await user.save();

            }


            res.json({

                message:
                    "Business added to favorites",

                favorites:
                    user.favorites

            });

        }

        catch (error) {

            console.error(
                "Favorite Error:",
                error
            );


            res.status(500).json({

                message:
                    "Error adding favorite",

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
                email,
                businessName,
                rating,
                review
            } = req.body;


            const ratingNumber =
                Number(rating);


            if (
                !businessName ||
                !review ||
                Number.isNaN(ratingNumber)
            ) {

                return res.status(400).json({

                    message:
                        "Business name, rating and review are required"

                });

            }


            if (
                ratingNumber < 1 ||
                ratingNumber > 5
            ) {

                return res.status(400).json({

                    message:
                        "Rating must be between 1 and 5"

                });

            }


            const newReview =
                new Review({

                    email:
                        email || "",

                    businessName:
                        businessName,

                    rating:
                        ratingNumber,

                    review:
                        review

                });


            const savedReview =
                await newReview.save();


            res.status(201).json({

                message:
                    "Review submitted successfully",

                review:
                    savedReview

            });

        }

        catch (error) {

            console.error(
                "Review Error:",
                error
            );


            res.status(500).json({

                message:
                    "Error submitting review",

                error:
                    error.message

            });

        }

    }
);


/* =========================================
   GET REVIEWS FOR BUSINESS
========================================= */

app.get(
    "/api/reviews/:businessName",
    async function (req, res) {

        try {

            const businessName =
                decodeURIComponent(
                    req.params.businessName
                );


            const reviews =
                await Review.find({

                    businessName:
                        businessName

                })
                .sort({

                    createdAt:
                        -1

                });


            res.json(
                reviews
            );

        }

        catch (error) {

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
   GET ALL BUSINESSES
========================================= */

app.get(
    "/api/businesses",
    async function (req, res) {

        try {

            const businesses =
                await Business.find()
                    .sort({

                        name:
                            1

                    });


            res.json(
                businesses
            );

        }

        catch (error) {

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
   GET ONE BUSINESS
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


            res.json(
                business
            );

        }

        catch (error) {

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
   ADD BUSINESS WITH IMAGE
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
                        "All business fields are required"

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


            const savedBusiness =
                await business.save();


            res.status(201).json(
                savedBusiness
            );

        }

        catch (error) {

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
   EDIT BUSINESS WITH IMAGE
========================================= */

app.put(
    "/api/businesses/:id",
    upload.single("image"),
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


            if (req.body.name) {

                business.name =
                    req.body.name;

            }


            if (req.body.category) {

                business.category =
                    req.body.category;

            }


            if (req.body.location) {

                business.location =
                    req.body.location;

            }


            if (req.body.phone) {

                business.phone =
                    req.body.phone;

            }


            if (req.file) {

                business.image =
                    "/images/uploads/" +
                    req.file.filename;

            }


            const updatedBusiness =
                await business.save();


            res.json(
                updatedBusiness
            );

        }

        catch (error) {

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

            const deletedBusiness =
                await Business.findByIdAndDelete(
                    req.params.id
                );


            if (!deletedBusiness) {

                return res.status(404).json({

                    message:
                        "Business not found"

                });

            }


            res.json({

                message:
                    "Business deleted successfully",

                business:
                    deletedBusiness

            });

        }

        catch (error) {

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
   MULTER ERROR HANDLER
========================================= */

app.use(
    function (
        error,
        req,
        res,
        next
    ) {

        if (
            error instanceof multer.MulterError
        ) {

            return res.status(400).json({

                message:
                    "Image upload error: " +
                    error.message

            });

        }


        if (
            error &&
            error.message ===
            "Only image files are allowed"
        ) {

            return res.status(400).json({

                message:
                    "Only JPG, JPEG, PNG, WEBP or GIF images are allowed"

            });

        }


        console.error(
            "Server Error:",
            error
        );


        res.status(500).json({

            message:
                "Internal server error",

            error:
                error.message

        });

    }
);


/* =========================================
   START SERVER
========================================= */

app.listen(
    PORT,
    "0.0.0.0",
    function () {

        console.log(
            `Business Locator Backend running on port ${PORT}`
        );

    }
);
```
