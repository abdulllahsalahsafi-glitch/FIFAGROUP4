import React from 'react'

function InfoModal({ data, onClose }) {
  return (
    <div className="drawerBackdrop" onClick={onClose}>
      <article
        className="infoModal glass"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="modalClose" onClick={onClose}>
          ×
        </button>
        <h3>{data.title}</h3>
        <p>{data.body}</p>
        {data.rows?.length ? (
          <div className="infoRows">
            {data.rows.map((row, index) => (
              <div key={index}>
                <b>{row.name}</b>
                <span>{row.value}</span>
              </div>
            ))}
          </div>
        ) : null}
      </article>
    </div>
  );
}

export default InfoModal
