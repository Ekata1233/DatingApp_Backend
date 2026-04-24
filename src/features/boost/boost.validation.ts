export const validateUpgradeBoost = (body: any) => {
  if (!body.boost_option_id) {
    return "boost_option_id is required";
  }
  return null;
};


export const validateActivateBoost = (body: any) => {
  if (!body.user_boost_id) {
    return "user_boost_id is required";
  }
  return null;
};
