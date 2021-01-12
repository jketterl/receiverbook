class FilterService {
    getFiltersFromRequest(req) {
        return Object.fromEntries(
            Object.entries(req.query).filter(([key, value]) => {
                return (['band', 'type'].includes(key) && value != '');
            })
        );
    }
}

module.exports = FilterService;