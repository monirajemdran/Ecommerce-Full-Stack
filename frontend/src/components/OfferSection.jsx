import "./OfferSection.css";
import { useEffect, useState } from "react";

function OfferSection({ products = [] }) {

  const [time, setTime] =
    useState(Date.now());

  // LIVE TIMER

  useEffect(() => {

    const interval =
      setInterval(() => {

        setTime(Date.now());

      }, 1000);

    return () =>
      clearInterval(interval);

  }, []);

  // FILTER OFFER PRODUCTS

  const offerProducts =
    products.filter((item) => {
      return item.isOffer && item.approved;
    });

  // TIMER

  const getTimeLeft = (endTime) => {

    if (!endTime)
      return "No Timer";

    const total =
      new Date(endTime).getTime()
      - time;

    if (total <= 0)
      return "Offer Ended";

    const hours = Math.floor(
      total / (1000 * 60 * 60)
    );

    const minutes = Math.floor(
      (total / (1000 * 60)) % 60
    );

    const seconds = Math.floor(
      (total / 1000) % 60
    );

    return `${hours}h ${minutes}m ${seconds}s`;
  };

  return (

    <div className="offer-section">

      <h1 className="offer-title">
        Mega Offers 🔥
      </h1>

      {
        offerProducts.length === 0 ? (

          <div className="no-offer">

            <h2>
              No Offers Available 😔
            </h2>

          </div>

        ) : (

          <div className="offer-slider-wrapper">

            <div className="offer-slider-track">

              {/* FIRST SET */}

              {offerProducts.map((item) => (

                <div
                  className="offer-card"
                  key={item._id}
                >

                  <img
                    src={item.image}
                    alt=""
                  />

                  <div className="offer-details">

                    <h3>{item.name}</h3>

                    <p className="offer-percent">

                      {
                        Math.round(
                          (
                            (
                              item.originalPrice -
                              item.discountPrice
                            )
                            /
                            item.originalPrice
                          ) * 100
                        )
                      }

                      % OFF

                    </p>

                    <div className="offer-price-box">

                      <span className="old-price">

                        ₹{item.originalPrice}

                      </span>

                      <span className="new-price">

                        ₹{item.discountPrice}

                      </span>

                    </div>

                    <p className="timer">

                      ⏰ {
                        getTimeLeft(
                          item.offerEndTime
                        )
                      }

                    </p>

                    {item.couponCode && (
                      <p className="coupon-code" style={{
                        marginTop: "5px",
                        fontWeight: "bold",
                        color: "#f59e0b",
                        border: "1px dashed #f59e0b",
                        padding: "5px",
                        borderRadius: "5px",
                        display: "inline-block"
                      }}>
                        Coupon: {item.couponCode}
                      </p>
                    )}



                  </div>

                </div>

              ))}

              {/* DUPLICATE FOR INFINITE SLIDE */}

              {offerProducts.map((item) => (

                <div
                  className="offer-card"
                  key={item._id + "copy"}
                >

                  <img
                    src={item.image}
                    alt=""
                  />

                  <div className="offer-details">

                    <h3>{item.name}</h3>

                    <p className="offer-percent">

                      {
                        Math.round(
                          (
                            (
                              item.originalPrice -
                              item.discountPrice
                            )
                            /
                            item.originalPrice
                          ) * 100
                        )
                      }

                      % OFF

                    </p>

                    <div className="offer-price-box">

                      <span className="old-price">

                        ₹{item.originalPrice}

                      </span>

                      <span className="new-price">

                        ₹{item.discountPrice}

                      </span>

                    </div>

                    <p className="timer">

                      ⏰ {
                        getTimeLeft(
                          item.offerEndTime
                        )
                      }

                    </p>

                    {item.couponCode && (
                      <p className="coupon-code" style={{
                        marginTop: "5px",
                        fontWeight: "bold",
                        color: "#f59e0b",
                        border: "1px dashed #f59e0b",
                        padding: "5px",
                        borderRadius: "5px",
                        display: "inline-block"
                      }}>
                        Coupon: {item.couponCode}
                      </p>
                    )}

                  </div>

                </div>

              ))}

            </div>

          </div>

        )
      }

    </div>
  );
}

export default OfferSection;
