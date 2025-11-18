import { Box, Card, CardContent, Skeleton, Stack } from "@mui/material";

// Stat Card Skeleton (for Dashboard stats)
export const StatCardSkeleton = () => (
  <Card>
    <CardContent>
      <Stack direction="row" spacing={2} alignItems="center">
        <Skeleton variant="circular" width={40} height={40} />
        <Box sx={{ flexGrow: 1 }}>
          <Skeleton variant="text" width="60%" height={40} />
          <Skeleton variant="text" width="80%" />
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

// Review Card Skeleton (for recent reviews)
export const ReviewCardSkeleton = () => (
  <Card variant="outlined">
    <CardContent>
      <Stack spacing={1}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
        >
          <Box sx={{ flexGrow: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Skeleton variant="text" width="40%" height={24} />
              <Skeleton variant="rounded" width={80} height={24} />
            </Stack>
            <Skeleton variant="text" width="60%" />
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Skeleton variant="text" width={30} />
            <Skeleton variant="circular" width={20} height={20} />
            <Skeleton variant="rounded" width={70} height={24} />
          </Stack>
        </Stack>
        <Skeleton variant="text" width="90%" />
        <Skeleton variant="text" width="95%" />
        <Skeleton variant="text" width="80%" />
      </Stack>
    </CardContent>
  </Card>
);

// Company Card Skeleton
export const CompanyCardSkeleton = () => (
  <Card>
    <CardContent>
      <Stack spacing={2}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
        >
          <Box sx={{ flexGrow: 1 }}>
            <Skeleton variant="text" width="70%" height={32} />
            <Skeleton
              variant="rounded"
              width={100}
              height={24}
              sx={{ mt: 1 }}
            />
          </Box>
          <Skeleton variant="circular" width={32} height={32} />
        </Stack>

        <Skeleton variant="text" width="95%" />
        <Skeleton variant="text" width="85%" />

        <Stack spacing={1}>
          <Stack direction="row" spacing={2}>
            <Skeleton variant="text" width="40%" />
            <Skeleton variant="text" width="30%" />
          </Stack>
          <Skeleton variant="text" width="35%" />
        </Stack>

        <Skeleton variant="text" width="50%" />
      </Stack>
    </CardContent>
  </Card>
);

// Profile Section Skeleton
export const ProfileSectionSkeleton = () => (
  <Card>
    <CardContent>
      <Stack spacing={3}>
        <Box>
          <Skeleton variant="text" width="40%" height={32} />
          <Box sx={{ height: 1, bgcolor: "divider", mt: 2 }} />
        </Box>

        <Stack spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Box key={i}>
              <Skeleton variant="text" width="30%" />
              <Skeleton variant="text" width="60%" height={24} sx={{ mt: 1 }} />
            </Box>
          ))}
        </Stack>

        <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
          <Skeleton variant="rounded" width={120} height={40} />
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

// Generic Content Skeleton
export const ContentSkeleton = () => (
  <Box sx={{ p: 3 }}>
    <Skeleton variant="text" width="30%" height={36} />
    <Skeleton variant="text" width="50%" sx={{ mt: 1 }} />

    <Stack spacing={2} sx={{ mt: 4 }}>
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent>
            <Skeleton variant="text" width="80%" height={28} />
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="70%" />
          </CardContent>
        </Card>
      ))}
    </Stack>
  </Box>
);

// Header Skeleton (for loading state in header)
export const HeaderSkeleton = () => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
    <Skeleton variant="circular" width={32} height={32} />
  </Box>
);

// Keyword Chip Skeleton
export const KeywordChipSkeleton = () => (
  <Skeleton variant="rounded" width={100} height={32} />
);

// Monthly Summary Skeleton
export const MonthlySummarySkeleton = () => (
  <Card variant="outlined">
    <CardContent>
      <Stack spacing={3}>
        {/* Navigation area */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Skeleton variant="rounded" width={120} height={40} />
          <Skeleton variant="text" width={150} height={28} />
          <Skeleton variant="rounded" width={120} height={40} />
        </Stack>

        {/* Summary content */}
        <Stack spacing={2}>
          <Skeleton variant="text" width="100%" height={24} />
          <Skeleton variant="text" width="95%" height={24} />
          <Skeleton variant="text" width="90%" height={24} />
          <Skeleton variant="text" width="85%" height={24} />
        </Stack>
      </Stack>
    </CardContent>
  </Card>
);

// Chart Skeleton (for Rating Distribution and Timeline charts)
export const ChartSkeleton = () => (
  <Card sx={{ p: 2, borderRadius: "18px", boxShadow: 2 }}>
    <Stack spacing={2}>
      <Box>
        <Skeleton variant="text" width="40%" height={28} />
        <Skeleton variant="text" width="60%" height={20} sx={{ mt: 1 }} />
      </Box>
      <Box sx={{ height: 250 }}>
        <Skeleton variant="rectangular" width="100%" height="100%" />
      </Box>
    </Stack>
  </Card>
);

// Improvements Card Skeleton
export const ImprovementsCardSkeleton = () => (
  <Card
    variant="outlined"
    sx={{
      borderRadius: 2,
      border: 1,
      borderColor: "error.light",
      bgcolor: "error.light",
      background: "linear-gradient(to bottom, rgba(211, 47, 47, 0.05), rgba(211, 47, 47, 0.02))",
    }}
  >
    <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
      <Stack spacing={3}>
        <Box>
          <Skeleton variant="text" width="50%" height={28} />
          <Skeleton variant="text" width="70%" height={20} sx={{ mt: 1 }} />
        </Box>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
            gap: 2,
          }}
        >
          <Skeleton variant="rectangular" width="100%" height={100} />
          <Skeleton variant="rectangular" width="100%" height={100} />
        </Box>
        <Stack spacing={1.5}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rectangular" width="100%" height={80} />
          ))}
        </Stack>
        <Skeleton variant="rounded" width="100%" height={48} />
      </Stack>
    </CardContent>
  </Card>
);
