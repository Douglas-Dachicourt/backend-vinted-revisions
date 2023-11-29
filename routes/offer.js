const express = require("express");
// const app = express();
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;
const convertToBase64 = require("../utils/ConvertToBase64");
const router = express.Router();

const Offer = require("../Models/Offer");
const isAuthenticated = require("../middlewares/isAuthenticated");

// ------------------------- ROUTE POUR POSTER ANNONCE ----------------------- //

router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      const pictureToUpload = req.files.picture;
      const result = await cloudinary.uploader.upload(
        convertToBase64(pictureToUpload)
      );

      const newOffer = new Offer({
        product_name: req.body.title,
        product_description: req.body.description,
        product_price: req.body.price,
        product_image: result,
        product_details: [
          {
            MARQUE: req.body.brand,
          },
          {
            TAILLE: req.body.size,
          },
          {
            ETAT: req.body.condition,
          },
          {
            COULEUR: req.body.color,
          },
          {
            EMPLACEMENT: req.body.city,
          },
        ],
        owner: req.user,
      });
      await newOffer.save();

      res.status(201).json({
        _id: newOffer._id,
        product_name: newOffer.product_name,
        product_description: newOffer.product_description,
        product_price: newOffer.product_price,
        product_details: [
          {
            MARQUE: newOffer.product_details[0].MARQUE,
          },
          {
            TAILLE: newOffer.product_details[1].TAILLE,
          },
          {
            ETAT: newOffer.product_details[2].ETAT,
          },
          {
            COULEUR: newOffer.product_details[3].COULEUR,
          },
          {
            EMPLACEMENT: newOffer.product_details[4].EMPLACEMENT,
          },
        ],
        owner: {
          account: {
            username: req.user.account.username,
            avatar: {
              secure_url: req.user.account.avatar.secure_url,
            },
          },
          _id: req.user._id,
        },
        product_image: {
          secure_url: newOffer.product_image.secure_url,
        },
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);
// ------------------------------------------- //
// -------------------- RECHERCHE ANNONCES -------------------------- //

router.get("/offers", async (req, res) => {
  try {
    // ------------ SYSTEME PAGINATION ----------------- //
    const filter = {};
    const newFilter = {};

    const page = req.query.page;
    const skipPage = Number(page - 1) * 5;

    // page = 1 // 0   ------ 0  -------- 0
    // page = 2 // 2   ------ 3  -------- 5
    // page = 3 // 4   ------ 6  -------- 10
    // page = 4 // 6   ------ 9  -------- 15

    // ------------------ RECHERCHE ARTICLE ----------------- //

    const title = new RegExp(req.query.title, "i");
    // console.log(title);

    {
      req.query.title && (newFilter.product_name = title);
    }

    // ------------------- TRI PAR PRIX " > & < " ------------ //

    const price = req.query.sort;
    if (price === "price-asc") {
      filter.product_price = 1;
    } else if (price === "price-desc") {
      filter.product_price = -1;
    }

    // -------------------- TRI PAR FOURCHETTE DE PRIX -------------- //

    const priceForkMin = req.query.priceMin;
    const priceForkMax = req.query.priceMax;

    {
      priceForkMin && (newFilter.product_price = { $gte: priceForkMin });
    }

    {
      priceForkMax && (newFilter.product_price = { $lte: priceForkMax });
    }

    {
      priceForkMin &&
        priceForkMax &&
        (newFilter.product_price = {
          $gte: priceForkMin,
          $lte: priceForkMax,
        });
    }

    // if (priceForkMax) {
    //   newFilter.product_price = { $lte: priceForkMax };
    // }

    // console.log(newFilter);

    // {
    //   req.query.priceMin &&
    //     (newFilter.product_price = { $gte: Number(req.query.priceMin) });
    // }

    // // console.log(Number(req.query.priceMin));

    // {
    //   req.query.priceMax &&
    //     (newFilter.product_price = { $lte: Number(req.query.priceMax) });
    // }

    // ----------------------------------------------- //

    const search = await Offer.find(newFilter)
      .skip(skipPage)
      .limit(5)
      .sort(filter)
      .select(
        "product_name product_price product_details product_description product_image.secure_url"
      )
      .populate("owner", "account.username account.avatar.secure_url");

    console.log(search);

    res.status(200).json({
      count: search.length,
      offers: search,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ------------------------- RECHERCHE PAR ID ARTICLE EN PARAMS ------------ //

router.get("/offers/:id", async (req, res) => {
  try {
    const request = await Offer.findById(req.params.id)
      .populate("owner", "account.username account.avatar.secure_url")
      .select(
        "product_name product_price product_details product_description product_image.secure_url"
      );
    // console.log(request);

    res.status(200).json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
