const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/role.middleware");
const { auditContextMiddleware } = require("../infrastructure/audit/auditContext");
const { ROLES } = require("../domain/constants/member.constants");

router.use(authenticate);
router.use(auditContextMiddleware);
router.use(authorize([ROLES.CAN_BO_CHINH_TRI]));

router.get("/", userController.getAllUsers);
router.post("/", userController.createUser);
router.put("/:id", userController.updateUser);
router.put("/:id/change-password", userController.changePassword);
router.delete("/:id", userController.deleteUser);

module.exports = router;
