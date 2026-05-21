import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Analytics from '@/models/Analytics';
import { requireAdmin } from '@/lib/server/auth';

export async function GET(req: NextRequest) {
    const unauth = await requireAdmin(req);
    if (unauth) return unauth;
    try {
        await connectDB();
        const url = new URL(req.url);
        const days = parseInt(url.searchParams.get('days') || '30', 10);
        const from = url.searchParams.get('from');
        const to = url.searchParams.get('to');

        let startDate: Date;
        let endDate: Date;
        if (from && to) {
            startDate = new Date(from);
            endDate = new Date(to);
            if (!to.includes('T')) endDate.setHours(23, 59, 59, 999);
        } else {
            startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            endDate = new Date();
        }

        const dateFilter = { $gte: startDate, $lte: endDate };
        const excludeLocal = { 'geo.countryCode': { $ne: 'LO' } };

        const totalPageviews = await Analytics.countDocuments({
            eventType: 'pageview', createdAt: dateFilter, ...excludeLocal,
        });
        const uniqueSessions = await Analytics.distinct('sessionId', {
            createdAt: dateFilter, ...excludeLocal,
        });
        const cvSubmissions = await Analytics.countDocuments({
            eventType: 'cv_submission', createdAt: dateFilter, ...excludeLocal,
        });
        const cvUploads = await Analytics.countDocuments({
            eventType: 'cv_upload', createdAt: dateFilter, ...excludeLocal,
        });
        const cvManual = await Analytics.countDocuments({
            eventType: 'cv_manual', createdAt: dateFilter, ...excludeLocal,
        });

        const pageviewsByPage = await Analytics.aggregate([
            { $match: { eventType: 'pageview', createdAt: dateFilter, 'geo.countryCode': { $ne: 'LO' } } },
            { $group: { _id: '$page', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
        ]);
        const visitorsByCountry = await Analytics.aggregate([
            { $match: { createdAt: dateFilter, 'geo.countryCode': { $exists: true, $ne: 'LO' } } },
            { $group: { _id: { country: '$geo.country', code: '$geo.countryCode' }, count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
        ]);
        const visitorsByCity = await Analytics.aggregate([
            { $match: { createdAt: dateFilter, 'geo.city': { $exists: true, $nin: [null, 'Localhost'] } } },
            { $group: { _id: '$geo.city', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
        ]);
        const languageUsage = await Analytics.aggregate([
            { $match: { createdAt: dateFilter, language: { $exists: true }, 'geo.countryCode': { $ne: 'LO' } } },
            { $group: { _id: '$language', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);
        const dailyPageviews = await Analytics.aggregate([
            { $match: { eventType: 'pageview', createdAt: dateFilter, 'geo.countryCode': { $ne: 'LO' } } },
            { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
        ]);
        const dailyCVs = await Analytics.aggregate([
            { $match: { eventType: 'cv_submission', createdAt: dateFilter } },
            { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
        ]);
        const highMatchEvents = await Analytics.countDocuments({
            eventType: 'high_match', createdAt: dateFilter,
        });
        const highMatchStats = await Analytics.aggregate([
            { $match: { eventType: 'high_match', createdAt: dateFilter } },
            { $group: { _id: null, totalHighMatches: { $sum: '$metadata.highMatches' }, avgTopScore: { $avg: '$metadata.topScore' } } },
        ]);
        const deviceTypes = await Analytics.aggregate([
            { $match: { createdAt: dateFilter, 'device.type': { $exists: true }, 'geo.countryCode': { $ne: 'LO' } } },
            { $group: { _id: '$device.type', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);
        const browsers = await Analytics.aggregate([
            { $match: { createdAt: dateFilter, 'browser.name': { $exists: true, $ne: null }, 'geo.countryCode': { $ne: 'LO' } } },
            { $group: { _id: '$browser.name', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
        ]);
        const operatingSystems = await Analytics.aggregate([
            { $match: { createdAt: dateFilter, 'device.os': { $exists: true, $ne: null }, 'geo.countryCode': { $ne: 'LO' } } },
            { $group: { _id: '$device.os', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
        ]);
        const screenSizes = await Analytics.aggregate([
            { $match: { createdAt: dateFilter, 'screen.width': { $exists: true }, 'geo.countryCode': { $ne: 'LO' } } },
            { $group: { _id: { $concat: [{ $toString: '$screen.width' }, 'x', { $toString: '$screen.height' }] }, count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
        ]);

        return NextResponse.json({
            success: true,
            data: {
                totalPageviews,
                uniqueVisitors: uniqueSessions.length,
                cvSubmissions,
                cvUploads,
                cvManual,
                highMatchEvents,
                highMatchStats: highMatchStats[0] || { totalHighMatches: 0, avgTopScore: 0 },
                pageviewsByPage,
                visitorsByCountry,
                visitorsByCity,
                languageUsage,
                dailyPageviews,
                dailyCVs,
                deviceTypes,
                browsers,
                operatingSystems,
                screenSizes,
            },
        });
    } catch (err) {
        console.error('Analytics summary error:', err);
        const msg = err instanceof Error ? err.message : 'Error';
        return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
}
