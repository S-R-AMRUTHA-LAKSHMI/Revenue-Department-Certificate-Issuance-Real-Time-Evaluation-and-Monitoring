const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');

router.get('/locations', applicationController.getLocations);
router.get('/certificates/:taluk', applicationController.getCertificates);
router.get('/applications/:location/:certificate/counts', applicationController.getApplicationCounts);
router.get('/applications/:location/:certificate', applicationController.getApplications);
router.get('/application/:id/:certificate', applicationController.getApplicationDetails);
router.post('/applications/:id/:certificate/approve', applicationController.approveApplication);
router.post('/applications/:id/:certificate/reject', applicationController.rejectApplication);
router.get('/applications/:id/:certificate/pdf/:documentType', applicationController.getPdf);
router.get('/overall-status', applicationController.getOverallStatus);
router.get('/certificate-status', applicationController.getCertificateStatus);
router.get('/taluk-status', applicationController.getTalukStatus);
router.post('/send-income-sms', applicationController.sendIncomeSMS);
router.post('/send-community-sms', applicationController.sendCommunitySMS);
router.get('/certificate/:certificateId', applicationController.getCertificate);

module.exports = router;
