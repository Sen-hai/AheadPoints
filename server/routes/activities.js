// 签到路由
router.post("/:id/checkin", auth, async (req, res) => {
  try {
    const { latitude, longitude, isIPLocation } = req.body;
    const activityId = req.params.id;
    const userId = req.user.id;

    // 获取活动信息
    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({ success: false, message: "活动不存在" });
    }

    // 检查是否在签到时间范围内
    const now = new Date();
    const checkinStartTime = new Date(activity.checkinStartTime);
    const checkinEndTime = new Date(activity.checkinEndTime);

    if (now < checkinStartTime || now > checkinEndTime) {
      return res
        .status(400)
        .json({ success: false, message: "不在签到时间范围内" });
    }

    // 检查是否已经签到
    const existingCheckin = await Checkin.findOne({
      activity: activityId,
      user: userId,
    });

    if (existingCheckin) {
      return res
        .status(400)
        .json({ success: false, message: "您已经签到过了" });
    }

    // 计算用户位置与活动位置的距离
    const distance = calculateDistance(
      latitude,
      longitude,
      activity.latitude,
      activity.longitude
    );

    // 如果是IP定位，允许更大的误差范围（10公里）
    // 如果是精确定位，保持原有的5公里限制
    const maxDistance = isIPLocation ? 10000 : 5000;

    if (distance > maxDistance) {
      return res.status(400).json({
        success: false,
        message: `您距离活动地点${(distance / 1000).toFixed(
          2
        )}公里，超出签到范围（${maxDistance / 1000}公里）`,
      });
    }

    // 创建签到记录
    const checkin = new Checkin({
      activity: activityId,
      user: userId,
      location: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
      isIPLocation: isIPLocation,
    });

    await checkin.save();

    res.json({
      success: true,
      message: "签到成功",
      data: checkin,
    });
  } catch (error) {
    console.error("签到失败:", error);
    res.status(500).json({ success: false, message: "签到失败，请重试" });
  }
});
