export default function gen_comm_block(id) {
    return (
        <div key={id} className="comm_container">
            <div className="comms_label">Commentator #{id}</div>
            <div className="comms_block">
                <input type="text" placeholder="Prefix (leave blank if none)" className="comms_prefix" />
                <input type="text" placeholder="Tag/Name" className="comms_tag" />
            </div>
        </div>
    );
}
