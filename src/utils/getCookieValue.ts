export function getCookieValue(cookieString, cookieName) {
  try {
    const name = cookieName + "=";
    const cookies = cookieString.split(";");
    for (let i = 0; i < cookies.length; i++) {
      let cookie = cookies[i].trim();
      if (cookie.indexOf(name) === 0) {
        return cookie.substring(name.length, cookie.length);
      }
    }
    return null;
  } catch (error) {
    console.log(error);
    return null;
  }
}
