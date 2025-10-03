import express from "express";
import Session from "../models/Session.js";
import Course from "../models/Course.js";

const router = express.Router();

// GET cart
router.get("/", async (req, res) => {
  //Add your code here
  const { sid: sessionId } = req.signedCookies; // getting the current login session.

  if (!sessionId) {
    return res.status(403).json({ error: "Session Expired." });
  }

  const session = await Session.findById({ _id: sessionId }); // find the session by id.
  // console.log({ session });

  const courseIds = session.data.cart.map(({ courseId }) => courseId);
  const courses = await Course.find({ _id: { $in: courseIds } });

  const cartCoursesDetails = courses.map((course) => {
    const { id, name, image, price } = course;

    const { quantity } = session.data.cart.find(
      ({ courseId }) => courseId === id
    );

    return {
      id: id,
      name,
      image,
      price,
      quantity,
    };
  });

  return res.status(200).json(cartCoursesDetails);
});

// // Add to cart in Simple way.
// router.post("/", async (req, res) => {
//   const { courseId } = req.body;
//   // get the session of the current request.
//   const session = await Session.findById(req.signedCookies.sid);

//   const courseAlreadyExists = session.data.cart.find(
//     (cart) => cart.courseId.toString() === courseId
//   );

//   if (courseAlreadyExists) {
//     courseAlreadyExists.quantity += 1;
//     session.markModified("data.cart");
//   } else {
//     // Manipulate nested session data.
//     session.set("data.cart", [...session.data.cart, { courseId, quantity: 1 }]);
//   }

//   await session.save();

//   return res.status(201).json({ message: "Course added to the cart." });
// });

// Add to cart in standered way.
router.post("/", async (req, res) => {
  const { courseId } = req.body;
  const { sid: sessionId } = req.signedCookies;
  // get the session of the current request.
  const result = await Session.updateOne(
    {
      _id: sessionId, // find this session through sessionId
      "data.cart.courseId": courseId, // find this sepecific courseId to increase its quantity.
    },
    {
      $inc: { "data.cart.$.quantity": 1 },
    }
  );

  // console.log(result);

  if (result.matchedCount === 0) {
    await Session.updateOne(
      { _id: sessionId },
      {
        $push: {
          // TODO: must learn, how we can play with array using MongoDB operations.
          "data.cart": { courseId, quantity: 1 },
        },
      }
    );
  }

  return res.status(201).json({ message: "Course added to the cart." });
});

// Remove course from cart
router.delete("/:courseId", async (req, res) => {
  //Add your code here
  const { courseId } = req.params;
  const { sid: sessionId } = req.signedCookies; // getting the current login session.

  if (!sessionId) {
    return res.status(403).json({ error: "Session Expired." });
  }

  await Session.updateOne(
    { _id: sessionId },
    {
      $pull: {
        // TODO: must learn, how we can play with array using MongoDB operations.
        "data.cart": { courseId },
      },
    }
  );

  return res.status(200).json({ message: "Cart item deleted." });
});

// Clear cart
router.delete("/", async (req, res) => {
  //Add your code here
});

export default router;
